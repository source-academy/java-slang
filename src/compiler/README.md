This is a bookkeeping of the planned scope of the compiler. It will be updated from time to time to reflect the current status of the compiler and to make the scope clearer. For a more formal treatment of what features are being supported, see scope.txt for a BNF-form of the Java sub-language.

**Features that are already supported**

- Single source file, single public class, with exactly one main method
- Methods that have `public static` access flags, return `int/void`, never throw exception
- `int` variables
- `int/boolean/String` literals
- Controls (`if-else`, `while`, `do-while`, basic `for` loop, `break`, `continue`, `return` statements), loops and if-elses can be nested in each other
- Arithmetic and conditional expressions
- Assignment statements
- Method invocation
- Non-static import statements
- Single dimension array declaration/initialization

**Features that are planned to support**

- Class fields (with `public static` access flag)
- Primitive type variables
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

