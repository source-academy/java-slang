import { ClassFile } from "../../ClassFile/types";
import AbstractSystem from "./AbstractSystem";

export default class SourceSystem extends AbstractSystem {
  private stdoutBuffer: string = "";
  private stderrBuffer: string = "";

  readFile(path: string): ClassFile {
    return JSON.parse(localStorage.getItem(path) ?? "{}");
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
