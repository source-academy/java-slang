# JVM Scope

## Class file

All structures in the classfile format are supported, with the exception of:

1. `magic`: not checked
2. `minor_version`, `major_version`: not checked
3. `constant_pool_count`, `interfaces_count`, `fields_count`, `methods_count`, `attributes_count`: Not verified with actual array length

**Verification of class files are not supported**. All classfiles are assumed verified.

### Constants

1. `CONSTANT_MethodHandle_info`: Partially implemented. Relies on `MethodHandleNatives::linkMethodHandleConstant` for resolution, some native methods invoked by `linkMethodHandleConstant` may not be implemented.
2. `CONSTANT_MethodType_info`: Partially implemented. Relies on `MethodHandleNatives::findMethodHandleType` for resolution, some native methods invoked by `findMethodHandleType` may not be implemented.
3. `CONSTANT_InvokeDynamic_info`: Partially implemented. Relies on `MethodHandleNatives::linkCallSite` for resolution, some native methods invoked by `linkCallSite` may not be implemented.

### Attributes

All attributes in the classfile format are supported, with the exception of:

1. `RuntimeVisibleAnnotations`, `RuntimeInvisibleAnnotations`, `RuntimeVisibleParameterAnnotations`, `RuntimeInvisibleParameterAnnotations`, `RuntimeVisibleTypeAnnotations`, `RuntimeInvisibleTypeAnnotations`, `AnnotationDefault`, `MethodParameters`: Not supported.

## Class libraries

Support for the implementation of class libraries should be assumed to not be supported unless otherwise stated.
Native method implementations are not within the scope of this project.

Some native methods have been implemented so examples can still be run. These implementations are not tested, and should not be assumed correct.

## Opcodes

All opcodes are supported, with the exception of the below opcodes:

1. `invokedynamic`: Partially supported. Depends on native methods required to resolve the call site.
2. `invokevirtual`: Normal invocation fully supported. Signature polymorphic methods partially supported. Depends on native methods required to resolve the method handle.
3. Reserved opcodes `impdep1`, `impdep2`, `breakpoint`: not supported.
