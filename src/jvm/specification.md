# Java-slang Java Virtual Machine documentation

This JVM follows the Java SE8 Edition [JVM Specification](https://docs.oracle.com/javase/specs/jvms/se8/html/index.html).

This documentation documents any limitations or differences not covered in the official specifcations above, and is sectioned
in a way that mirrors the official specification document.

## Structure of the JVM

### Primitive Types and Values

Unlike Java, JavaScript numbers are all 64 bit doubles. This JVM stores each type as follows:

- `byte`: `number`, truncated using bitmask.
- `short`: `number`, truncated using bitmask.
- `int`: `number`, decimals truncated using bitwise or with 0.
- `long`: `bigint`, extra bits truncated using bitmask.
- `char`: `number`, truncated using bitmask.
- `float`: `number`, rounded using `Math.fround`.
- `double`: `number`, equivalent.

### Reference Types and Values

2 classes have been implemented to represent reference types:

- Normal reference types: `JvmObject`.
- Array types: `JvmArray`, stores a JavaScript array internally.

### Java Virtual Machine Stacks

Each JVM thread has a stack. Stacks contain stackframes. 
JVM stacks are implemented with JavaScript arrays.

There are 3 kinds of stack frames:

1. `BytecodeStackFrame`: A normal stackframe.
2. `InternalStackFrame`: A stackframe that functions the same way as `BytecodeStackFrame`, except when the method 
   returns the return value is passed to a callback instead of being pushed onto the stackframe below.
3. `NativeStackFrame`: A stackframe for native methods. 
   Executes the function supplied by the Java Native Interface instead of running bytecode like the previous stackframes.

Even though longs can fit into a single index of a JavaScript array, they nonetheless occupy 2 indexes in the stack.
The wide value is first pushed onto the stack, then a special `INACCESSIBLE` object, which throws an error if we attempt to access it or its properties.

### Heap

This JVM does not manage its own memory. Since Java objects are represented as JavaScript objects, the JavaScript Garbage Collector
will free up memory as necessary.

There is, however, a `UnsafeHeap` implemented. This is implemented specifically for `Unsafe` operations, and is required since during JVM initialization,
memory is allocated then read to determine the endianness of the operating system.

### Local Variables

Similar to the stack implementation, local variable arrays are stored as JavaScript arrays in the JVM. Wide values like doubles and longs also occupy 2 indexes.

An exception to this rule is in `NativeStackFrame`, where wide values only occupy 1 index, so its behaviour can be more in line with the JavaScript functions that it calls.

### Floating-Point Modes

The `ACC_STRICT` flag is not implemented.

### Class Libraries

The JVM is expected to support implementation of class libraries.

Since the standard library is largely left unimplemented, the full scope of what the JVM needs to support is not yet understood.

Some features are not yet supported.

1. Security related classes and packages
2. Weak references, such as in the package java.lang.ref

## The class file format

This chapter describes differences in the class file representation used in this JVM compared to the official specification.
For information related to the class file format refer to the official [JVM Specification](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-4.html).

### ClassFile Structure

1. `magic`: we do not verify this value.
2. `minor_version`, `major_version`: we do not verify this value.
3. `constant_pool_count`, `interfaces_count`, `fields_count`, `methods_count`, `attributes_count`: we do not verify this value.

### Constant Pool

The below constants may not be fully implemented.

1. `CONSTANT_MethodHandle_info`: Relies on `MethodHandleNatives::linkMethodHandleConstant` for resolution, some native methods invoked by `linkMethodHandleConstant` may not be implemented.
2. `CONSTANT_MethodType_info`: Relies on `MethodHandleNatives::findMethodHandleType` for resolution, some native methods invoked by `findMethodHandleType` may not be implemented.
3. `CONSTANT_InvokeDynamic_info`: Relies on `MethodHandleNatives::linkCallSite` for resolution, some native methods invoked by `linkCallSite` may not be implemented.

### Attributes

The below attributes are not supported, and will be present in the class data as an `UnhandledAttribute`.

1. `RuntimeVisibleAnnotations`
2. `RuntimeInvisibleAnnotations`
3. `RuntimeVisibleParameterAnnotations`
4. `RuntimeInvisibleParameterAnnotations`
5. `RuntimeVisibleTypeAnnotations`
6. `RuntimeInvisibleTypeAnnotations`
7. `AnnotationDefault`
8. `MethodParameters`

### Verification of class Files

Verification is skipped entirely.

## Loading, Linking, and Initializing 

### Java Virtual Machine Startup

The JVM startup process is as follows:

1. Essential classes are loaded (`Object`,`Thread`,`System`,`Class`,`ClassLoader`,`ThreadGroup`,`Unsafe`)
2. `ThreadGroup` and `Thread` classes are initialized, then the initial thread is instantiated.
3. `System` is initialized by calling `System::initializeSystemClass`.
4. The system class loader is initialized by calling `ClassLoader::getSystemClassLoader`.
5. The main class is loaded with the system class loader. the `main` method is run.

### Creating Array Classes

All array classes are loaded by the bootstrap class loader. 
The component class of the array may be loaded by other class loaders.

### Loading Constraints

The JVM does not ensure loading constraints are checked. The same class, loaded by 2 different class loaders, are treated as different classes.

### Linking

Symbolic references are implemented as lazy resolution.

### Verification

This is skipped.

### Resolution

#### Method Type and Method Handle Resolution

Method types are resolved by calling `MethodHandleNatives::findMethodHandleType`. The native implementations of methods used by this method may not be fully implemented/tested.

Method handles are resolved by calling `MethodHandleNatives::linkMethodHandleConstant`. The native implementations of methods used by this method may not be fully implemented/tested.

Call Site Specifiers are resolved by calling `MethodHandleNatives::linkCallSite`. The native implementations of methods used by this method may not be fully implemented/tested.

#### Access Control

Access control also implements the nest mate test from the [SE11 edition JVM specifications](https://docs.oracle.com/javase/specs/jvms/se11/html/jvms-5.html#jvms-5.4.4). 
There is a bug where the anonymous inner classes from lambda creation are invoking private methods of the original class directly instead of the synthetic bridge methods we generate.
To work around this, we add a `NestHost` attribute to the created class, and implement the nest mate access control logic as a hacky solution.

## The Java Virtual Machine Instruction Set

- `BREAKPOINT`: Not implemented. Throws an error.
- `IMPDEP1`: Not implemented. Throws an error.
- `IMPDEP2`: Not implemented. Throws an error.
