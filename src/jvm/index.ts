import { ClassFile } from "../ClassFile/types";
import { Lib } from "./jni";
import JVM from "./jvm";
import CustomSystem from "./utils/CustomSystem";
import parseBin from "./utils/disassembler";

const setupJVM = (options: {
  mainClass?: string;
  javaClassPath?: string;
  userDir?: string;
  nativesPath?: string;
  callbacks: {
    readFileSync: (path: string) => ClassFile;
    readFile?: (path: string) => Promise<any>;
    stdout?: (message: string) => void;
    stderr?: (message: string) => void;
    onFinish?: () => void;
  };
  natives?: Lib;
}) => {
  const sys = new CustomSystem(
    options.callbacks.readFileSync,
    options.callbacks.readFile ??
      (async () => {
        throw new Error("readFile not implemented");
      }),
    options.callbacks.stdout ?? console.log,
    options.callbacks.stderr ?? console.error
  );

  const jvm = new JVM(sys, {
    javaClassPath: options.javaClassPath,
    nativesPath: options.nativesPath,
    userDir: options.userDir,
    natives: options.natives,
  });
  return () => jvm.run(options.mainClass ?? "Main", options.callbacks.onFinish);
};

export { parseBin };

export default setupJVM;
