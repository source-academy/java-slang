This is a bookkeeping of the planned scope of the compiler. It will be updated from time to time to reflect the current status of the compiler and to make the scope clearer.

**Features that are already supported**

- Single source file, single public class, with exactly one main method
- Methods that have `public static` access flags, return `int/void`, never throw exception
- `int` variables
- `int/boolean/String` literals
- Controls (`if-else`, `while`, `do-while`, basic `for` loop, `return` statements), loops and if-elses can be nested in each other
- Arithmetic and conditional expressions
- Assignment statements
- Method invocation

**Features that are planned to support**

- Import statements
- Class fields (with `public static` access flag)
- Single dimension array declaration/initialization
- Primitive type variables
- Controls (`break/continue`)
- Object instantiation (with `new` keyword)

**Features that will not be supported**

- Annotations
- Multiple files, modules, packages
- Instance fields/methods
- Interfaces
- Class inheritance
- Method overloading/overriding
- Generics
- Type casting

