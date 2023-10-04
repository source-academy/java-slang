import * as fs from "fs";

export function writeToFile(filename: string, binary: Uint8Array) {
  fs.writeFileSync(filename, binary);
}
