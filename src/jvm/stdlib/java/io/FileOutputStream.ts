import { JvmArray } from '../../../types/reference/Array'
import { JvmObject } from '../../../types/reference/Object'
import Thread from '../../../thread'
import { logger } from '../../../utils'

/**
 * Decodes a slice of a Java `byte[]` (signed, two's-complement values) as
 * UTF-8, without `Buffer` - this runs inside a browser Worker when bundled
 * for the Conductor evaluator, where `Buffer` doesn't exist.
 */
function utf8Decode(bytes: number[], offset: number, length: number): string {
  let result = ''
  let i = offset
  const end = offset + length
  while (i < end) {
    const b0 = bytes[i] & 0xff
    if (b0 < 0x80) {
      result += String.fromCharCode(b0)
      i += 1
    } else if ((b0 & 0xe0) === 0xc0) {
      const b1 = bytes[i + 1] & 0x3f
      result += String.fromCharCode(((b0 & 0x1f) << 6) | b1)
      i += 2
    } else if ((b0 & 0xf0) === 0xe0) {
      const b1 = bytes[i + 1] & 0x3f
      const b2 = bytes[i + 2] & 0x3f
      result += String.fromCharCode(((b0 & 0x0f) << 12) | (b1 << 6) | b2)
      i += 3
    } else {
      const b1 = bytes[i + 1] & 0x3f
      const b2 = bytes[i + 2] & 0x3f
      const b3 = bytes[i + 3] & 0x3f
      const codePoint = ((b0 & 0x07) << 18) | (b1 << 12) | (b2 << 6) | b3
      const adjusted = codePoint - 0x10000
      result += String.fromCharCode(0xd800 + (adjusted >> 10), 0xdc00 + (adjusted & 0x3ff))
      i += 4
    }
  }
  return result
}

const functions = {
  /**
   * Writes bytes to the file descriptor. pipes to stdout/stderr if fd is 1/2.
   * Not implemented for other file descriptors.
   * @param thread
   * @param locals
   * @returns
   */
  'writeBytes([BIIZ)V': (thread: Thread, locals: any[]) => {
    const stream = locals[0] as JvmObject
    const bytes = locals[1] as JvmArray
    const offset = locals[2] as number
    const len = locals[3] as number

    const javafd = stream._getField(
      'fd',
      'Ljava/io/FileDescriptor;',
      'java/io/FileOutputStream'
    ) as JvmObject
    const fd = javafd._getField('fd', 'I', 'java/io/FileDescriptor') as number

    if (fd === -1) {
      thread.throwNewException('java/io/IOException', 'Bad file descriptor')
      return
    }

    // stdout
    if (fd === 1 || fd === 2) {
      const str = utf8Decode(bytes.getJsArray(), offset, len)
      const sys = thread.getJVM().getSystem()
      fd === 1 ? sys.stdout(str) : sys.stderr(str)
      thread.returnStackFrame()
      return
    }

    throw new Error('Not implemented')
  },

  /**
   * Not implemented. NOP.
   * @param thread
   * @param locals
   */
  'initIDs()V': (thread: Thread) => {
    logger.warn('FileOutputStream.initIDs()V not implemented')
    thread.returnStackFrame()
  }
}

export default functions
