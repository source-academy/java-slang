import { program, run } from './__utils__/library'

describe('method overriding through an intermediate class', () => {
  it('runs an override inherited from an intermediate class', async () => {
    const { result, out } = await run(
      program(
        `Base b = new C(); int r = b.f(); System.out.println(r);`,
        `class Base { public int f() { return 1; } }
         class B extends Base { public int f() { return 2; } }
         class C extends B {}`
      )
    )
    expect(result.status).toBe('finished')
    expect(out).toEqual(['2'])
  })

  it('prefers the nearest override', async () => {
    const { out } = await run(
      program(
        `Base b = new C(); int r = b.f(); System.out.println(r);`,
        `class Base { public int f() { return 1; } }
         class B extends Base { public int f() { return 2; } }
         class C extends B { public int f() { return 3; } }`
      )
    )
    expect(out).toEqual(['3'])
  })

  it("runs an inherited override of Object's toString", async () => {
    const { out } = await run(
      program(
        `Object o = new Dog(); String s = o.toString(); System.out.println(s);`,
        `class Animal { public String toString() { return "animal"; } }
         class Dog extends Animal {}`
      )
    )
    expect(out).toEqual(['animal'])
  })
})
