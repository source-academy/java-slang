import Thread from "./thread";

export class JNI {
  private classes: {
    [className: string]: {
      methods: {
        [methodName: string]: (thread: Thread, locals: any[]) => void;
      };
    };
  };

  constructor() {
    this.classes = {};
  }

  registerNativeMethod(
    className: string,
    methodName: string,
    method: (thread: Thread, locals: any[]) => void
  ) {
    throw new Error('Not Implemented');
  }

  getNativeMethod(
    className: string,
    methodName: string
  ): (thread: Thread, locals: any[]) => void {
    return this.classes[className]?.methods?.[methodName];
  }
}

export function registerNatives(jni: JNI) {
}
