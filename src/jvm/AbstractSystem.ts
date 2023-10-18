import { ClassFile } from "../ClassFile/types";

export default abstract class AbstractSystem {
  abstract readFile(path: string): ClassFile;
}
