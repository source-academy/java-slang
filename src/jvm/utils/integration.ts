import JVM from "../jvm";
import SourceSystem from "./SourceSystem";

export function run(mainClass: string) {
  const nativeSystem = new SourceSystem(
    () => {
      throw new Error("Not implemented");
    },
    () => Promise.reject("Not implemented"),
    console.log, // x => DisplayBufferService.push(x, context.external)
    (x) => {
      throw new Error(x);
    }
  );
  const jvm = new JVM(nativeSystem);
  jvm.run(mainClass);
}
