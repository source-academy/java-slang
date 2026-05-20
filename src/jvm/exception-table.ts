import { ClassData } from "./types/class/ClassData"

class Entry {
    from: number
    to: number
    target: number
    type: ClassData

    constructor(from: number, to: number, target: number, type: ClassData) {
        this.from = from;
        this.to = to;
        this.target = target;
        this.type = type;
    }
}

export class ExceptionTable {
    private entries: Entry[]

    retrieve(line: number): Entry | null {
        this.entries.forEach(entry => {
            if (line >= entry.from && line <= entry.to) {
                return entry
            }
        })
        return null
    }

    insert(from: number, to: number, target: number, type: ClassData): void {
        var entry = new Entry(from, to, target, type)
        this.entries.push(entry)
    }
}