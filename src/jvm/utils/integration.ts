import JVM from "../jvm";
import { ClassFile } from "../../ClassFile/types";
import CustomSystem from "./CustomSystem";

export function run(
  mainClass: string,
  options: {
    readClassFile: (x: string) => ClassFile;
    readNatives: (x: string) => Promise<any>;
    stdout?: (x: string) => void;
    stderr?: (x: string) => void;
  }
) {
  const nativeSystem = new CustomSystem(
    options.readClassFile,
    options.readNatives,
    options.stdout ?? console.log,
    options.stderr ?? console.error
  );
  const jvm = new JVM(nativeSystem);
  jvm.run(mainClass);
}
