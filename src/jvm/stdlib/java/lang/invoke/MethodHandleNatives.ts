import {
  MemberNameFlags,
  MethodHandleReferenceKind,
} from "../../../../constants";
import Thread from "../../../../thread";
import { checkError } from "../../../../types/Result";
import { ReferenceClassData } from "../../../../types/class/ClassData";
import { JvmArray } from "../../../../types/reference/Array";
import { JvmObject } from "../../../../types/reference/Object";
import { j2jsString } from "../../../../utils";

const functions = {
  "init(Ljava/lang/invoke/MemberName;Ljava/lang/Object;)V": (
    thread: Thread,
    locals: any[]
  ) => {
    const ref = locals[1] as JvmObject;
    const memberName = locals[0] as JvmObject;
    const refClassname = ref.getClass().getClassname();

    if (refClassname === "java/lang/reflect/Field") {
      throw new Error("Not implemented");
    } else if (refClassname === "java/lang/reflect/Method") {
      const clazz = ref._getField(
        "clazz",
        "Ljava/lang/Class;",
        "java/lang/reflect/Method"
      );
      const classData = clazz.getNativeField("classRef") as ReferenceClassData;
      const methodSlot = ref._getField(
        "slot",
        "I",
        "java/lang/reflect/Method"
      ) as number;
      const method = classData.getMethodFromSlot(methodSlot);
      if (!method) {
        thread.returnStackFrame();
        return;
      }

      let flags = method.getAccessFlags() | MemberNameFlags.MN_IS_METHOD;
      if (method.checkStatic()) {
        flags |=
          MethodHandleReferenceKind.REF_invokeStatic <<
          MemberNameFlags.MN_REFERENCE_KIND_SHIFT;
      } else if (classData.checkInterface()) {
        flags |=
          MethodHandleReferenceKind.REF_invokeInterface <<
          MemberNameFlags.MN_REFERENCE_KIND_SHIFT;
      } else {
        flags |=
          MethodHandleReferenceKind.REF_invokeVirtual <<
          MemberNameFlags.MN_REFERENCE_KIND_SHIFT;
      }
      // constructor should be handled separately
      // check and |= callersensitive here in the future

      memberName._putField("flags", "I", "java/lang/invoke/MemberName", flags);
      memberName._putField(
        "clazz",
        "Ljava/lang/Class;",
        "java/lang/invoke/MemberName",
        clazz
      );
      memberName.putNativeField("vmtarget", method);
      thread.returnStackFrame();
      return;
      // MemberNameFlags
    } else if (refClassname === "java/lang/reflect/Constructor") {
      const clazz = ref._getField(
        "clazz",
        "Ljava/lang/Class;",
        "java/lang/reflect/Constructor"
      );
      const classData = clazz.getNativeField("classRef") as ReferenceClassData;
      const methodSlot = ref._getField(
        "slot",
        "I",
        "java/lang/reflect/Constructor"
      ) as number;
      const method = classData.getMethodFromSlot(methodSlot);
      if (!method) {
        thread.returnStackFrame();
        return;
      }
      const flags =
        method.getAccessFlags() |
        MemberNameFlags.MN_IS_CONSTRUCTOR |
        (MethodHandleReferenceKind.REF_invokeSpecial <<
          MemberNameFlags.MN_REFERENCE_KIND_SHIFT);
      memberName._putField("flags", "I", "java/lang/invoke/MemberName", flags);
      memberName._putField(
        "clazz",
        "Ljava/lang/Class;",
        "java/lang/invoke/MemberName",
        clazz
      );
      memberName.putNativeField("vmtarget", method);
      thread.returnStackFrame();
      return;
    }

    thread.throwNewException(
      "java/lang/InternalError",
      "init: Invalid target."
    );
  },

  "resolve(Ljava/lang/invoke/MemberName;Ljava/lang/Class;)Ljava/lang/invoke/MemberName;":
    (thread: Thread, locals: any[]) => {
      const memberName = locals[0] as JvmObject; // MemberName

      const type = memberName._getField(
        "type",
        "Ljava/lang/Object;",
        "java/lang/invoke/MemberName"
      ) as JvmObject;
      const jNameString = memberName._getField(
        "name",
        "Ljava/lang/String;",
        "java/lang/invoke/MemberName"
      ) as JvmObject;
      const clsObj = memberName._getField(
        "clazz",
        "Ljava/lang/Class;",
        "java/lang/invoke/MemberName"
      ) as JvmObject;
      const flags = memberName._getField(
        "flags",
        "I",
        "java/lang/invoke/MemberName"
      ) as number;

      if (clsObj === null || jNameString === null || type === null) {
        thread.throwNewException(
          "java/lang/IllegalArgumentException",
          "Invalid MemberName"
        );
        return;
      }

      const clsRef = clsObj.getNativeField("classRef") as ReferenceClassData;
      const name = j2jsString(jNameString);

      if (
        flags &
        (MemberNameFlags.MN_IS_CONSTRUCTOR | MemberNameFlags.MN_IS_METHOD)
      ) {
        const rtype = (
          (
            type._getField(
              "rtype",
              "Ljava/lang/Class;",
              "java/lang/invoke/MethodType"
            ) as JvmObject
          ).getNativeField("classRef") as ReferenceClassData
        ).getDescriptor();
        const ptypes = (
          type._getField(
            "ptypes",
            "[Ljava/lang/Class;",
            "java/lang/invoke/MethodType"
          ) as JvmArray
        )
          .getJsArray()
          .map((cls: JvmObject) =>
            cls.getNativeField("classRef").getDescriptor()
          );
        const methodDesc = `(${ptypes.join("")})${rtype}`;

        // method resolution
        const lookupRes = clsRef.lookupMethod(
          name + methodDesc,
          null as any,
          false,
          false,
          true,
          true
        );

        if (checkError(lookupRes)) {
          thread.throwNewException(
            "java/lang/NoSuchMethodError",
            `Invalid method ${methodDesc}`
          );
          return;
        }
        const method = lookupRes.result;

        const methodFlags = method.getAccessFlags();
        const refKind = flags >>> MemberNameFlags.MN_REFERENCE_KIND_SHIFT;
        memberName._putField(
          "flags",
          "I",
          "java/lang/invoke/MemberName",
          methodFlags | flags
        );

        memberName.putNativeField("vmtarget", method);
        thread.returnStackFrame(memberName);
        return;
      } else if (flags & MemberNameFlags.MN_IS_FIELD) {
        const descriptor = (
          type.getNativeField("classRef") as ReferenceClassData
        ).getDescriptor();
        const field = clsRef.lookupField(name + descriptor);
        if (field === null) {
          thread.throwNewException(
            "java/lang/NoSuchFieldError",
            `Invalid field ${name}`
          );
          return;
        }
        const fieldflags = field.getAccessFlags();
        memberName._putField(
          "flags",
          "I",
          "java/lang/invoke/MemberName",
          fieldflags | flags
        );
        memberName.putNativeField("field", field);
        thread.returnStackFrame(memberName);
        return;
      } else {
        thread.throwNewException(
          "java/lang/LinkageError",
          `Could not resolve member name`
        );
        return;
      }
    },

  "registerNatives()V": (thread: Thread, locals: any[]) => {
    thread.returnStackFrame();
  },

  "getConstant(I)I": (thread: Thread, locals: any[]) => {
    thread.returnStackFrame(0);
  },
};

export default functions;
