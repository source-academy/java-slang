# Architecture

## Entry Point

The CSEC machine module lives in `java-slang/src/ec-evaluator`.

The entry point is in `ec-evaluator/index.ts`, in `runECEvaluator`.

The evaluator loop is in `ec-evaluator/interpreter.ts`, in `evaluate`.

The frontend used for the Source Academy website has a specialised implementation for the Java CSEC machine to include implementation for the 'Classes' component.

## Components

The CSEC machine comprises 4 components:

- Control
- Stash
- Environment
- Classes

All components are declared and implemented in `ec-evaluator/components.ts`.

**Control**

The control is implemented as a simple stack of `ControlItem`s.

**Stash**

The stash is implemented as a simple stack of `StashItem`s.

**Environment**

The environment is implemented as a doubly-linked list of frames.

**Classes**

Classes are a component unique to the Java CSEC machine, which is a specialisation of the CSE notional machine (which is, in its theoretical form, language-agnostic). This component was added to better reflect class and object-oriented programming semantics with minimal mental overhead (to keep the machine easy to understand for learners), instead of attempting to represent classes entirely in terms of constructs native to the formal CSE machine (or an existing familiar implementation, like the Source CSE machine).

The `Class` type is defined (as an interface) in `ec-evaluator/types.ts`, like all other CSE machine types.

### Initialisation

When a program is first input for evaluation, it is parsed and transformed into a compilation unit. Normal Java programs are compiled in separate classes, with each top-level classes occupying one file each. When compiled into bytecode, class files may be run, and if so, the entry point is the `main` function of the class file to be run.

The CSEC machine does not permit distinct files for Java programs. Instead, all classes are declared in the same file. The entry point is then the first declared `main` method in the entire file. It is a runtime error if no such method exists.

### Evaluation Loop

As is the case with all CSE machines, the evaluator repeatedly pops the current command off the top of the control, and performs actions based on the command seen.

Step-wise evaluation is handled by dispatch to functions of the type

`(command, environment, control, stash) => void`,

which has the type alias `CmdEvaluator` as defined in `interpreter.ts`.

The necessary function for each command (instruction or AST node type) is registered in `cmdEvaluators`, a table declared also in `interpreter.ts`.

The full list of registered command evaluators (and thus AST node types and instructions that may be presently handled by the CSEC machine) are:

_AST Node Types_

- `CompilationUnit`
- `NormalClassDeclaration`
- `Block`
- `ConstructorDeclaration`
- `FieldDeclaration`
- `LocalVariableDeclarationStatement`
- `ExpressionStatement`
- `ReturnStatement`
- `Assignment`
- `MethodInvocation`
- `ClassInstanceCreationExpression`
- `ExplicitConstructorInvocation`
- `Literal`
- `Void`
- `ExpressionName`
- `BinaryExpression`

_Instructions_

- `Pop`
- `Assign`
- `BinaryOperation`
- `Invocation`
- `Env`
- `Reset`
- `EvalVariable`
- `Res`
- `Deref`
- `New`
- `ResType`
- `ResTypeCont`
- `ResOverload`
- `ResOverride`
- `ResConOverload`

All AST node types are supplied by (various modules in) `src/ast/types/…`, while all instructions are supplied by `src/ec-evaluator/types.ts`.
