This is a bookkeeping of the planned scope of the compiler. It will be updated from time to time to reflect the current status of the compiler and to make the scope clearer. For a more formal treatment of what features are being supported, see scope.txt for a BNF-form of the Java sub-language.

**Features that are already supported**

- Single source file, multiple classes, with exactly one class named "Main" with a main method
- Methods that have `public static` access flags
- Any primitive type and String variables
- Controls (`if-else`, `while`, `do-while`, basic `for` loop, `break`, `continue`, `return` statements), loops and if-elses can be nested in each other
- Arithmetic and conditional expressions
- Assignment statements
- Method invocation
- Non-static import statements
- Single dimension array declaration/initialization
- Class fields (with `public static` access flag)
- Object instantiation (with `new` keyword)
- Instance fields/methods
- Class inheritance
- Method overloading/overriding
- Type casting (both implicit and explicit)
- Abstract classes
- Exception handling (`throws`, `try`, `catch` and `finally`)
- Many standard library classes and methods (in import/generated-lib-info.json)
- Switch statements
- Enums
- Static nested classes



**Features that can possibly be supported in the future**

- Annotations
- Multiple files, modules, packages
- Interfaces
- Generics
- Newer keywords, e.g. `yield`
- Explicit constructor invocation (`super(...)` and `this(...)`)
- Multi-dimensional arrays


**Testing**
Unit tests are located in the "__tests__/tests" folder. The main testing file is "__tests__/index.ts", in which the tests to be run can be specified. To run, navigate to the main java-slang folder and run:
```bash
$ yarn test src/compiler/__tests__/index.ts
```
