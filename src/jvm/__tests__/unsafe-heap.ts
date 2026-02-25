import { UnsafeHeap } from '../unsafe-heap'

let unsafeHeap: UnsafeHeap

beforeEach(() => {
  unsafeHeap = new UnsafeHeap()
})

describe('UnsafeHeap', () => {
  test('Should allocate memory correctly and return a valid offset', () => {
    const allocatedSize = BigInt(16)
    const offset = unsafeHeap.allocate(allocatedSize)

    expect(typeof offset).toBe('bigint')
    expect(offset).toBe(BigInt(0))

    const dataView = unsafeHeap.get(offset)
    expect(dataView).toBeInstanceOf(DataView)
    expect(dataView.byteLength).toBe(Number(allocatedSize))

    const secondOffset = unsafeHeap.allocate(allocatedSize)
    expect(secondOffset).toBe(BigInt(16))
  })
  
  test('Should free memory correctly', () => {
    const allocatedSize = BigInt(16)
    const offset = unsafeHeap.allocate(allocatedSize)
    unsafeHeap.free(offset)

    expect(() => unsafeHeap.get(offset)).toThrow()
  })
  
  test('Should free memory and update size correctly', () => {
    const allocatedSize = BigInt(16)
    const offset = unsafeHeap.allocate(allocatedSize)
    const secondOffset = unsafeHeap.allocate(allocatedSize)
    const thirdOffset = unsafeHeap.allocate(allocatedSize)
    unsafeHeap.free(secondOffset)

    expect(() => unsafeHeap.get(secondOffset)).toThrow()
    expect(unsafeHeap.get(offset)).toBeInstanceOf(DataView)
    expect(unsafeHeap.get(thirdOffset)).toBeInstanceOf(DataView)
  })
  
  test('Should return different offsets for each allocation', () => {
    const allocatedSize = BigInt(8)
    const firstOffset = unsafeHeap.allocate(allocatedSize)
    const secondOffset = unsafeHeap.allocate(allocatedSize)
    const thirdOffset = unsafeHeap.allocate(allocatedSize)

    expect(firstOffset).not.toBe(secondOffset)
    expect(secondOffset).not.toBe(thirdOffset)
    expect(thirdOffset).not.toBe(firstOffset)

    expect(secondOffset).toBe(firstOffset + BigInt(8))
    expect(thirdOffset).toBe(secondOffset + BigInt(8))
  })
  
  test('Should handle multiple allocations and frees without errors', () => {
    const sizes = [BigInt(8), BigInt(16), BigInt(24), BigInt(32)]
    const offsets: bigint[] = []

  // Allocate memory
    for (const size of sizes) {
      const offset = unsafeHeap.allocate(size)
      offsets.push(offset)
      expect(typeof offset).toBe('bigint')
      const dataView = unsafeHeap.get(offset)
      expect(dataView).toBeInstanceOf(DataView)
      expect(dataView.byteLength).toBe(Number(size))
    }

    // Free memory
    for (let i = 0; i < offsets.length; i++) {
      const offset = offsets[i]
      unsafeHeap.free(offset)
      expect(() => unsafeHeap.get(offset)).toThrow()
    }

    // Allocate memory again
    for (const size of sizes) {
      const offset = unsafeHeap.allocate(size)
      expect(typeof offset).toBe('bigint')
      const dataView = unsafeHeap.get(offset)
      expect(dataView).toBeInstanceOf(DataView)
      expect(dataView.byteLength).toBe(Number(size))
    }
  })
  
  test('Should correctly update the total size after multiple allocations and frees', () => {
    const unsafeHeap = new UnsafeHeap()
  
    // Allocate memory
    const offset1 = unsafeHeap.allocate(BigInt(16))
    const offset2 = unsafeHeap.allocate(BigInt(24))
    const offset3 = unsafeHeap.allocate(BigInt(32))
  
    expect(unsafeHeap['size']).toBe(72)
  
    // Free some memory
    unsafeHeap.free(offset2)
  
    expect(unsafeHeap['size']).toBe(48)
  
    // Allocate more memory
    const offset4 = unsafeHeap.allocate(BigInt(8))
  
    expect(unsafeHeap['size']).toBe(56)
  
    // Free remaining memory
    unsafeHeap.free(offset1)
    unsafeHeap.free(offset3)
    unsafeHeap.free(offset4)
  
    expect(unsafeHeap['size']).toBe(0)
  })
})
