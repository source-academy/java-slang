# Control

## Definitions

Control items are split into two kinds:

- AST nodes, and
- instructions.

The following specification uses the following terms and definitions to specify the behaviour of the CSEC machine when a certain control item is executed.

A control item is _executed_ when it is run by the CSEC machine. The CSEC machine can only execute one control item per step.

A control item, when executed, may:

- pop zero or more stash items,
- push zero or more control items, and
- push zero or more stash items.

A control item is _fully executed_ when it is executed, and when all of the control items created during its reduction have been fully executed. Where the context is clear, when we use the term 'fully executed' to refer a particular state of the CSEC machine, we refer to the time when a control item is _first_ fully executed.

For each control item, we define:

- _Qualified Name_: the name of the control item and its type (AST node or instruction)
- _Preconditions_: the conditions that must be fulfilled when the control item is executed.
- _Postconditions_: the conditions that are fulfilled when the control item is fully executed.
- _Expansion_: the conditions that are fulfilled when the control item is fully executed.

## Control Item Set

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
