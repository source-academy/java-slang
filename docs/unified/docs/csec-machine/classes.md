# Classes

## Classes

CSEC machine classes are stored in the environment, like bindings (in fact, class objects are just bound names in the CSEC machine).

Class declarations merely extend (directly or indirectly) from the global environment frame. The `Object` class is initialised first for any program evaluated in the CSEC machine (created as part of the `CompilationUnit` expansion), and extends the global environment.

Each class owns its own environment frame, which contain all class member bindings (static fields, static methods, instance methods, and constructors).

## Instances

Instances of classes are also stored in the environment. For a particular instance of a class, a frame is created for that class and for each of all of its superclasses; they are then linked together in order to reflect the scoping semantics of classes (hierarchical search).

An empty frame is created corresponding to the `Object` class' instance frame. which is then extended with the superclasses of `Object` with a frame for each class. As the frames are created, the instance fields *and* static fields are populated.

The `Object` frame is presently empty.

Static fields are handled by aliasing the variable identifiers. That is, instead of pointing the instance frame to the class' frame (where the static variables were stored), the variables are redeclared in the instance frames and point to the same underlying 'location' (implementation detail).