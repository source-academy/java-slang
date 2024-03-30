import Thread from '../../../../thread'
import { ReferenceClassData, ArrayClassData } from '../../../../types/class/ClassData'
import { JvmObject } from '../../../../types/reference/Object'
import { ResultType } from '../../../../types/Result'

const functions = {
  'newArray(Ljava/lang/Class;I)Ljava/lang/Object;': (thread: Thread, locals: any[]) => {
    const clsRef = (locals[0] as JvmObject).getNativeField('classRef') as ReferenceClassData
    const length = locals[1] as number
    const clsName = '[' + clsRef.getDescriptor()

    const arrClsRes = clsRef.getLoader().getClass(clsName)
    if (arrClsRes.status === ResultType.ERROR) {
      thread.throwNewException('java/lang/ClassNotFoundException', arrClsRes.msg)
      return
    }
    const arrClsRef = arrClsRes.result as ArrayClassData
    const arr = arrClsRef.instantiate()
    arr.initArray(length)
    thread.returnStackFrame(arr)
  }
}

export default functions
