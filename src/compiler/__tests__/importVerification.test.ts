import { compileFromSource } from '../index'
import { UnresolvedImportError } from '../error'

const wrap = (imports: string) => `
  ${imports}

  public class Main {
    public static void main(String[] args) {
      System.out.println("ok");
    }
  }
`

describe('import verification', () => {
  it('accepts a recognised single-type import', () => {
    expect(() => compileFromSource(wrap('import java.lang.System;'))).not.toThrow()
  })

  it('accepts a recognised on-demand import', () => {
    expect(() => compileFromSource(wrap('import java.util.*;'))).not.toThrow()
  })

  it('accepts an import from the generated metadata that was never hard-coded', () => {
    expect(() => compileFromSource(wrap('import java.lang.StringBuilder;'))).not.toThrow()
  })

  it('accepts no imports (implicit java.lang.*)', () => {
    expect(() => compileFromSource(wrap(''))).not.toThrow()
  })

  it('rejects an unknown single-type import', () => {
    expect(() => compileFromSource(wrap('import java.lang.Nonexistent;'))).toThrow(
      UnresolvedImportError
    )
  })

  it('rejects an unknown package on-demand import', () => {
    expect(() => compileFromSource(wrap('import com.example.*;'))).toThrow(UnresolvedImportError)
  })

  it('rejects a class imported from the wrong package', () => {
    expect(() => compileFromSource(wrap('import java.util.System;'))).toThrow(UnresolvedImportError)
  })

  it('names the offending import in the error message', () => {
    expect(() => compileFromSource(wrap('import java.lang.Bogus;'))).toThrow('java.lang.Bogus')
  })
})
