import { MemberNameFlags, MethodHandleReferenceKind } from '../../../../constants'
import Thread from '../../../../thread'
import { ReferenceClassData } from '../../../../types/class/ClassData'
import { Method } from '../../../../types/class/Method'
import { JvmArray } from '../../../../types/reference/Array'
import { JvmObject } from '../../../../types/reference/Object'
import { ResultType } from '../../../../types/Result'
import { j2jsString, js2jString, logger } from '../../../../utils'

const functions = {
  /**
   * Follows doppio's implementation {@link https://github.com/plasma-umass/doppio/blob/master/src/natives/java_lang.ts#L1519}, which in turn follows
   * JAMVM's implementation of this method {@link http://sourceforge.net/p/jamvm/code/ci/master/tree/src/classlib/openjdk/mh.c#l388}
   * @param thread
   * @param locals
   * @returns
   */
  'init(Ljava/lang/invoke/MemberName;Ljava/lang/Object;)V': (thread: Thread, locals: any[]) => {
    const ref = locals[1] as JvmObject
    const memberName = locals[0] as JvmObject
    const refClassname = ref.getClass().getName()

    if (refClassname === 'java/lang/reflect/Field') {
      throw new Error('Not implemented')
    } else if (refClassname === 'java/lang/reflect/Method') {
      const clazz = ref._getField('clazz', 'Ljava/lang/Class;', 'java/lang/reflect/Method')
      const classData = (clazz as JvmObject).getNativeField('classRef') as ReferenceClassData
      const methodSlot = ref._getField('slot', 'I', 'java/lang/reflect/Method') as number
      const method = classData.getMethodFromSlot(methodSlot)
      if (!method) {
        logger.warn('init(Ljava/lang/invoke/MemberName;Ljava/lang/Object;)V: Method not found')
        thread.returnStackFrame()
        return
      }

      let flags = method.getAccessFlags() | MemberNameFlags.MN_IS_METHOD
      if (method.checkStatic()) {
        flags |=
          MethodHandleReferenceKind.REF_invokeStatic << MemberNameFlags.MN_REFERENCE_KIND_SHIFT
      } else if (classData.checkInterface()) {
        flags |=
          MethodHandleReferenceKind.REF_invokeInterface << MemberNameFlags.MN_REFERENCE_KIND_SHIFT
      } else {
        flags |=
          MethodHandleReferenceKind.REF_invokeVirtual << MemberNameFlags.MN_REFERENCE_KIND_SHIFT
      }

      memberName._putField('flags', 'I', 'java/lang/invoke/MemberName', flags)
      memberName._putField('clazz', 'Ljava/lang/Class;', 'java/lang/invoke/MemberName', clazz)
      memberName.putNativeField('vmtarget', method.generateBridgeMethod())
      thread.returnStackFrame()
      return
      // MemberNameFlags
    } else if (refClassname === 'java/lang/reflect/Constructor') {
      const clazz = ref._getField('clazz', 'Ljava/lang/Class;', 'java/lang/reflect/Constructor')
      const classData = (clazz as JvmObject).getNativeField('classRef') as ReferenceClassData
      const methodSlot = ref._getField('slot', 'I', 'java/lang/reflect/Constructor') as number
      const method = classData.getMethodFromSlot(methodSlot)
      if (!method) {
        thread.returnStackFrame()
        return
      }
      const flags =
        method.getAccessFlags() |
        MemberNameFlags.MN_IS_CONSTRUCTOR |
        (MethodHandleReferenceKind.REF_invokeSpecial << MemberNameFlags.MN_REFERENCE_KIND_SHIFT)
      memberName._putField('flags', 'I', 'java/lang/invoke/MemberName', flags)
      memberName._putField('clazz', 'Ljava/lang/Class;', 'java/lang/invoke/MemberName', clazz)
      memberName.putNativeField('vmtarget', method.generateBridgeMethod())
      thread.returnStackFrame()
      return
    }

    thread.throwNewException('java/lang/InternalError', 'init: Invalid target.')
  },

  /**
   * Follows doppio's implementation {@link https://github.com/plasma-umass/doppio/blob/master/src/natives/java_lang.ts#L1519}.
   * @param thread
   * @param locals
   * @returns
   */
  'resolve(Ljava/lang/invoke/MemberName;Ljava/lang/Class;)Ljava/lang/invoke/MemberName;': (
    thread: Thread,
    locals: any[]
  ) => {
    const memberName = locals[0] as JvmObject // MemberName

    const type = memberName._getField(
      'type',
      'Ljava/lang/Object;',
      'java/lang/invoke/MemberName'
    ) as JvmObject
    const jNameString = memberName._getField(
      'name',
      'Ljava/lang/String;',
      'java/lang/invoke/MemberName'
    ) as JvmObject
    const clsObj = memberName._getField(
      'clazz',
      'Ljava/lang/Class;',
      'java/lang/invoke/MemberName'
    ) as JvmObject
    const flags = memberName._getField('flags', 'I', 'java/lang/invoke/MemberName') as number

    if (clsObj === null || jNameString === null || type === null) {
      thread.throwNewException('java/lang/IllegalArgumentException', 'Invalid MemberName')
      return
    }

    const clsRef = clsObj.getNativeField('classRef') as ReferenceClassData
    const name = j2jsString(jNameString)

    if (flags & (MemberNameFlags.MN_IS_CONSTRUCTOR | MemberNameFlags.MN_IS_METHOD)) {
      const rtype = (
        (
          type._getField('rtype', 'Ljava/lang/Class;', 'java/lang/invoke/MethodType') as JvmObject
        ).getNativeField('classRef') as ReferenceClassData
      ).getDescriptor()
      const ptypes = (
        type._getField('ptypes', '[Ljava/lang/Class;', 'java/lang/invoke/MethodType') as JvmArray
      )
        .getJsArray()
        .map((cls: JvmObject) => cls.getNativeField('classRef').getDescriptor())
      const methodDesc = `(${ptypes.join('')})${rtype}`

      // method resolution
      const lookupRes = clsRef.lookupMethod(
        name + methodDesc,
        null as any,
        false,
        false,
        true,
        true
      )
      if (lookupRes.status === ResultType.ERROR) {
        thread.throwNewException('java/lang/NoSuchMethodError', `Invalid method ${methodDesc}`)
        return
      }
      const method = lookupRes.result

      const methodFlags = method.getAccessFlags()
      memberName._putField('flags', 'I', 'java/lang/invoke/MemberName', methodFlags | flags)

      const bridge = method.generateBridgeMethod()
      memberName.putNativeField('vmtarget', bridge)

      thread.returnStackFrame(memberName)
      return
    } else if (flags & MemberNameFlags.MN_IS_FIELD) {
      const descriptor = (type.getNativeField('classRef') as ReferenceClassData).getDescriptor()
      const field = clsRef.lookupField(name + descriptor)
      if (field === null) {
        thread.throwNewException('java/lang/NoSuchFieldError', `Invalid field ${name}`)
        return
      }
      const fieldflags = field.getAccessFlags()
      memberName._putField('flags', 'I', 'java/lang/invoke/MemberName', fieldflags | flags)
      memberName.putNativeField('field', field)
      thread.returnStackFrame(memberName)
      return
    } else {
      thread.throwNewException('java/lang/LinkageError', `Could not resolve member name`)
      return
    }
  },

  /**
   * NOP.
   * @param thread
   */
  'registerNatives()V': (thread: Thread) => {
    thread.returnStackFrame()
  },

  /**
   * @todo Not implemented. Returns 0.
   * @param thread
   */
  'getConstant(I)I': (thread: Thread) => {
    thread.returnStackFrame(0)
  },

  /**
   * Follows doppio's implementation {@link https://github.com/plasma-umass/doppio/blob/master/src/natives/java_lang.ts#L1680}.
   * @param thread
   * @param locals
   * @returns
   */
  'getMembers(Ljava/lang/Class;Ljava/lang/String;Ljava/lang/String;ILjava/lang/Class;I[Ljava/lang/invoke/MemberName;)I':
    (thread: Thread, locals: any[]) => {
      const defc = locals[0] as JvmObject
      const matchName: string | null = locals[1] ? j2jsString(locals[1] as JvmObject) : locals[1]
      const matchSig: string | null = locals[2] ? j2jsString(locals[2] as JvmObject) : locals[2]
      const matchFlags = locals[3] as number
      let skip = locals[5] as number
      const results = (locals[6] as JvmArray).getJsArray()
      let matched = 0

      const cls = defc.getNativeField('classRef') as ReferenceClassData
      const methods = Object.values(cls.getDeclaredMethods())

      const addMethod = (method: Method) => {
        if (skip) {
          skip--
          return
        }

        if (results.length <= matched) {
          return
        }

        const memberName = results[matched] as JvmObject

        // set flags
        let flags = MemberNameFlags.MN_IS_METHOD
        let refKind = 0
        if (method.getClass().checkInterface()) {
          refKind = MethodHandleReferenceKind.REF_invokeInterface
        } else if (method.checkStatic()) {
          refKind = MethodHandleReferenceKind.REF_invokeStatic
        } else if (method.getName() === '<init>') {
          flags = MemberNameFlags.MN_IS_CONSTRUCTOR
          refKind = MethodHandleReferenceKind.REF_newInvokeSpecial
        } else {
          refKind = MethodHandleReferenceKind.REF_invokeVirtual
        }
        flags |= refKind << MemberNameFlags.MN_REFERENCE_KIND_SHIFT
        flags |= method.getAccessFlags()
        memberName._putField('flags', 'I', 'java/lang/invoke/MemberName', flags)

        // set clazz
        memberName._putField(
          'clazz',
          'Ljava/lang/Class;',
          'java/lang/invoke/MemberName',
          method.getClass().getJavaObject()
        )

        // set name
        memberName._putField(
          'name',
          'Ljava/lang/String;',
          'java/lang/invoke/MemberName',
          matchName ? locals[1] : js2jString(cls.getLoader(), method.getName())
        )

        // set type
        memberName._putField(
          'type',
          'Ljava/lang/Object;',
          'java/lang/invoke/MemberName',
          matchSig ? locals[2] : js2jString(cls.getLoader(), method.getDescriptor())
        )

        // set vmtarget
        memberName.putNativeField('vmtarget', method.generateBridgeMethod())

        matched++
      }

      // constructor
      if (matchFlags & MemberNameFlags.MN_IS_CONSTRUCTOR) {
        for (const method of methods) {
          if (
            (matchName === null || (matchName === '<init>' && method.getName() === '<init>')) &&
            (matchSig === null || method.getDescriptor() === matchSig)
          ) {
            addMethod(method)
          }
        }
      }

      // method
      if (matchFlags & MemberNameFlags.MN_IS_METHOD) {
        for (const method of methods) {
          if (
            method.getName() !== '<init>' &&
            (matchName === null || method.getName() === matchName) &&
            (matchSig === null || method.getDescriptor() === matchSig)
          ) {
            addMethod(method)
          }
        }
      }

      // fields
      if (matchFlags & MemberNameFlags.MN_IS_FIELD) {
        const fields = cls.getDeclaredFields()
        for (const field of fields) {
          if (skip) {
            skip--
            return
          }

          if (results.length <= matched) {
            return
          }

          const memberName = results[matched] as JvmObject
          // set flags
          let flags = MemberNameFlags.MN_IS_FIELD
          let refKind = 0
          if (field.checkStatic()) {
            refKind = MethodHandleReferenceKind.REF_getStatic
          } else {
            refKind = MethodHandleReferenceKind.REF_getField
          }
          flags |= refKind << MemberNameFlags.MN_REFERENCE_KIND_SHIFT
          flags |= field.getAccessFlags()
          memberName._putField('flags', 'I', 'java/lang/invoke/MemberName', flags)

          // set clazz
          memberName._putField(
            'clazz',
            'Ljava/lang/Class;',
            'java/lang/invoke/MemberName',
            field.getClass().getJavaObject()
          )

          // set name
          memberName._putField(
            'name',
            'Ljava/lang/String;',
            'java/lang/invoke/MemberName',
            matchName ? locals[1] : js2jString(cls.getLoader(), field.getName())
          )

          // set type
          memberName._putField(
            'type',
            'Ljava/lang/Object;',
            'java/lang/invoke/MemberName',
            matchSig ? locals[2] : js2jString(cls.getLoader(), field.getFieldDesc())
          )

          // set vmindex
          memberName.putNativeField('vmindex', field.getClass().getFieldVmIndex(field))
          matched++
        }
      }

      thread.returnStackFrame(matched)
    },

  'objectFieldOffset(Ljava/lang/invoke/MemberName;)J': (thread: Thread, locals: any[]) => {
    const memberName = locals[0] as JvmObject
    thread.returnStackFrame64(BigInt(memberName.getNativeField('field').slot))
  }
}

export default functions
