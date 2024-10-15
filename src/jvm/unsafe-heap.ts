/**
 * Heap implementation to support Java's Unsafe operations
 */
export class UnsafeHeap {
  private heap: {
    [key: number]: DataView
  } = {}
  private size: number = 0
  private key: number = 0

  /**
   * Allocates memory of a given size on the heap. returns the offset.
   */
  allocate(size: bigint): bigint {
    const ret = this.key
    const sizeInt = Number(size)
    this.key += sizeInt
    this.size += sizeInt
    this.heap[ret] = new DataView(new ArrayBuffer(sizeInt))
    return BigInt(ret)
  }

  /**
   * Gets the dataview at the offset.
   */
  get(offset: bigint): DataView {
    const dataView = this.heap[Number(offset)]
    if (!dataView) {
      throw new Error(`Invalid offset: ${offset}`)
    }
    return dataView
  }

  free(offset: bigint): void {
    const size = this.heap[Number(offset)].byteLength
    delete this.heap[Number(offset)]
    this.size -= size
  }
}
