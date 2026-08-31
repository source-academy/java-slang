# Stash

## Stash Item Set

- Primitive
	- Literal
- Reference (to an object/instance of a class)
- Value
	- Variable
	- Closure
	- Class
- Void
- Type

## Description

**Primitive.**
_Primitives_ are used for direct evaluation with primitive operations. Primitive operations only accept primitive types.

There is only one primitive type: _literals_. Literals are abstract representations of numbers in the CSEC machine.

**Reference.**
_References_ refer to Java objects.

**Value.**
The _Value_ type is a union type of three types:
- _Variables_: Todo
- ~ Messy implementation?
- _Closures_: Either methods or constructors
- ~ Messy implementation: why should instance and/or static methods and constructors be treated any differently? Why is that information baked into closures, when all a closure really is  is a function?
- _Classes_: Java Class definitions.

**Void.**
The _Void_ type represents the empty (uninhabited) type.

**Type.**
The _Type_ type is a symbolic reference to a Java type. More specifically, it is a symbolic reference to a Java class.

At runtime, instantiations of this type are resolved symbolically in an environment to a Java class.
