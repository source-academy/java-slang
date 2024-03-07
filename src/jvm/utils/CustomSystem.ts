import { ClassFile } from "../../ClassFile/types";
import AbstractSystem from "./AbstractSystem";

export default class CustomSystem extends AbstractSystem {
  private readClassFile: (path: string) => ClassFile;
  private readNatives: (path: string) => Promise<any>;
  private stdoutPipe: (message: string) => void;
  private stderrPipe: (message: string) => void;

  constructor(
    readClassFile: (path: string) => ClassFile,
    readNatives: (path: string) => Promise<any>,
    stdoutPipe: (message: string) => void,
    stderrPipe: (message: string) => void
  ) {
    super();
    this.readClassFile = readClassFile;
    this.readNatives = readNatives;
    this.stdoutPipe = stdoutPipe;
    this.stderrPipe = stderrPipe;
  }

  readFileSync(path: string): ClassFile {
    return this.readClassFile(path);
  }

  readFile(path: string): Promise<any> {
    return this.readNatives(path);
  }

  stdout(message: string): void {
    this.stdoutPipe(message);
  }

  stderr(message: string): void {
    this.stderrPipe(message);
  }
}
