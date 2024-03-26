import { JvmArray } from "../../../types/reference/Array";
import { JvmObject } from "../../../types/reference/Object";
import Thread from "../../../thread";
import { logger } from "../../../utils";

const functions = {
  'writeBytes([BIIZ)V': (thread: Thread, locals: any[]) => {
    const stream = locals[0] as JvmObject;
    const bytes = locals[1] as JvmArray;
    const offset = locals[2] as number;
    const len = locals[3] as number;

    const javafd = stream._getField(
      'fd',
      'Ljava/io/FileDescriptor;',
      'java/io/FileOutputStream'
    ) as JvmObject;
    const fd = javafd._getField('fd', 'I', 'java/io/FileDescriptor') as number;

    if (fd === -1) {
      thread.throwNewException('java/io/IOException', 'Bad file descriptor');
      return;
    }

    // stdout
    if (fd === 1 || fd === 2) {
      const buf: Buffer = Buffer.from(bytes.getJsArray());
      const str = buf.toString('utf8', offset, offset + len);
      const sys = thread.getJVM().getSystem();
      fd === 1 ? sys.stdout(str) : sys.stderr(str);
      thread.returnStackFrame();
      return;
    }

    throw new Error('Not implemented');
  },
  'initIDs()V': (thread: Thread, locals: any[]) => {
    logger.warn('FileOutputStream.initIDs()V not implemented');
    thread.returnStackFrame();
  },
};

export default functions;
