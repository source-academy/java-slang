import { ClassFile } from "../../ClassFile/types";
import AbstractSystem from "./AbstractSystem";
import parseBin from "./disassembler";

export default class SourceSystem extends AbstractSystem {
  private stdoutBuffer: string = "";
  private stderrBuffer: string = "";

  readFileSync(path: string): ClassFile {
    const binStr = localStorage.getItem(path);
    // @ts-ignore
    const ab = Uint8Array.from(binStr, (x) => x.charCodeAt(0));
    return parseBin(new DataView(ab.buffer));
  }

  readFile(path: string): Promise<any> {
    return import("../../" + path);
  }

  stdout(message: string): void {
    if (message.endsWith("\n")) {
      console.log(this.stdoutBuffer + message.slice(0, -1));
      this.stdoutBuffer = "";
      return;
    }

    this.stdoutBuffer += message;
  }

  stderr(message: string): void {
    if (message.endsWith("\n")) {
      console.log(this.stderrBuffer + message.slice(0, -1));
      this.stderrBuffer = "";
      return;
    }

    this.stderrBuffer += message;
  }
}
