# JVM Scope

## Class file

All structures in the classfile format are supported, with the exception of:

1. `magic`: not supported
2. `minor_version`, `major_version`: not supported
3. `constant_pool_count`, `interfaces_count`, `fields_count`, `methods_count`, `attributes_count`: Not supported

**Verification of class files are not supported**. All classfiles are assumed verified.

### Constants

1. `CONSTANT_MethodHandle_info`: Partially implemented. Relies on `MethodHandleNatives::linkMethodHandleConstant` for resolution, some native methods invoked by `linkMethodHandleConstant` may not be implemented.
2. `CONSTANT_MethodType_info`: Partially implemented. Relies on `MethodHandleNatives::findMethodHandleType` for resolution, some native methods invoked by `findMethodHandleType` may not be implemented.
3. `CONSTANT_InvokeDynamic_info`: Partially implemented. Relies on `MethodHandleNatives::linkCallSite` for resolution, some native methods invoked by `linkCallSite` may not be implemented.

### Attributes

All attributes in the classfile format are supported, with the exception of:

1. `RuntimeVisibleAnnotations`, `RuntimeInvisibleAnnotations`, `RuntimeVisibleParameterAnnotations`, `RuntimeInvisibleParameterAnnotations`, `RuntimeVisibleTypeAnnotations`, `RuntimeInvisibleTypeAnnotations`, `AnnotationDefault`, `MethodParameters`: Not supported.

## Class libraries

Native method implementations are out of the scope of the JVM.
Native methods not listed throws an `UnsatisfiedLinkError`. All implementations listed below are not tested.

### java

#### io

- `FileDescriptor::initIDs()V`: Not supported, currently a NOP
- `FileInputStream::initIDs()V`: Not supported, currently a NOP
- `FileOutputStream::initIDs()V`: Not supported, currently a NOP
- `FileOutputStream::writeBytes([BIIZ)V`: Partially supported, for file descriptors `1` and `2` (stdout and stderr)
- `UnixFileSystem::initIDs()V`: Not supported, currently a NOP
- `UnixFileSystem::canonicalize0(Ljava/lang/String;)Ljava/lang/String;`: Supported.
- `UnixFileSystem::getBooleanAttributes0(Ljava/io/File;)I`: Not supported. returns 0.
- `UnixFileSystem::list(Ljava/io/File;)[Ljava/lang/String;`: Not supported. returns null.

#### lang

- `Class::desiredAssertionStatus0(Ljava/lang/Class;)Z`: Not supported, returns 0.
- `Class::getModifiers()I`: Supported.
- `Class::getSuperclass()Ljava/lang/Class;`: Supported.
- `Class::registerNatives()V`: NOP
- `Class::getDeclaredFields0(Z)[Ljava/lang/reflect/Field;`: Supported.
- `Class::getPrimitiveClass(Ljava/lang/String;)Ljava/lang/Class;`: Supported.
- `Class::isArray()Z`: Supported.
- `Class::isPrimitive()Z`: Supported.
- `Class::getName0()Ljava/lang/String;`: Supported.
- `Class::getComponentType()Ljava/lang/Class;`: Supported.
- `Class::forName0(Ljava/lang/String;ZLjava/lang/ClassLoader;Ljava/lang/Class;)Ljava/lang/Class;`: Partially supported. Loading via `ClassLoader` object not supported.
- `Class::isInterface()Z`: Supported.
- `Class::getDeclaredConstructors0(Z)[Ljava/lang/reflect/Constructor;`: Supported.
- `Class::getDeclaredMethods0(Z)[Ljava/lang/reflect/Method;`: Supported.
- `Class::getDeclaringClass0()Ljava/lang/Class;`: Supported.
- `Class::isAssignableFrom(Ljava/lang/Class;)Z`: Supported.
- `Class::getEnclosingMethod0()[Ljava/lang/Object;`: Partially supported, reference classes not supported.
- `Class::getDeclaredClasses0()[Ljava/lang/Class;`: Supported.
- `Class::isInstance(Ljava/lang/Object;)Z`: Supported.
- `Class::getProtectionDomain0()Ljava/security/ProtectionDomain;`: Supported.
- `ClassLoader::registerNatives()V`: NOP
- `ClassLoader::findLoadedClass0(Ljava/lang/String;)Ljava/lang/Class`: Supported.
- `Double::doubleToRawLongBits(D)J`: Supported.
- `Double::longBitsToDouble(J)D`: Supported.
- `Float::floatToRawIntBits(F)I`: Supported.
- `Object::registerNatives()V`: NOP
- `Object::getClass()Ljava/lang/Class;`: Supported.
- `Object::clone()Ljava/lang/Object;`: Supported. Also clones native fields.
- `Object::hashCode()I`: Supported.
- `Object::wait(J)V`: Supported.
- `Object::notifyAll()V`: Suppported.
- `Runtime::availableProcessors()I`: Returns 1.
- `String::intern()Ljava/lang/String;`: Supported.
- `System::registerNatives()V`: Supported.
- `System::arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V`: Supported.
- `System::initProperties(Ljava/util/Properties;)Ljava/util/Properties;`: Partially supported, uses hardcoded values.
- `System::setIn0(Ljava/io/InputStream;)V`: Supported.
- `System::setOut0(Ljava/io/PrintStream;)V`: Supported.
- `System::setErr0(Ljava/io/PrintStream;)V`: Supported.
- `System::currentTimeMillis()J`: Supported.
- `System::identityHashCode(Ljava/lang/Object;)I`: Supported.
- `Thread::isAlive()Z`: Supported.
- `Thread::setPriority0(I)V`: Not supported, NOP.
- `Thread::registerNatives()V`: NOP
- `Thread::currentThread()Ljava/lang/Thread;`: Supported.
- `Thread::sleep(J)V`: Supported.
- `Thread::start0()V`: Supported.
- `Throwable::fillInStackTrace(I)Ljava/lang/Throwable;`: Not supported. Returns the throwable.
- `Throwable::getStackTraceDepth()I`: Not supported. Returns 0.

##### invoke

- `MethodHandleNatives::init(Ljava/lang/invoke/MemberName;Ljava/lang/Object;)V`: Partially supported. Caller sensitive flag not supported
- `MethodHandleNatives::resolve(Ljava/lang/invoke/MemberName;Ljava/lang/Class;)Ljava/lang/invoke/MemberName;`: Supported
- `MethodHandleNatives::registerNatives()V`: NOP
- `MethodHandleNatives::getConstant(I)I`: Not supported, returns 0
- `MethodHandleNatives::getMembers(Ljava/lang/Class;Ljava/lang/String;Ljava/lang/String;ILjava/lang/Class;I[Ljava/lang/invoke/MemberName;)I`: Supported
- `MethodHandleNatives::objectFieldOffset(Ljava/lang/invoke/MemberName;)J`: Supported

##### reflect

- `Array::newArray(Ljava/lang/Class;I)Ljava/lang/Object;`: Supported

#### security

- `AccessController::doPrivileged(Ljava/security/PrivilegedExceptionAction;Ljava/security/AccessControlContext;)Ljava/lang/Object;`: Supported.
- `AccessController::doPrivileged(Ljava/security/PrivilegedExceptionAction;)Ljava/lang/Object;`: Supported.
- `AccessController::doPrivileged(Ljava/security/PrivilegedAction;Ljava/security/AccessControlContext;)Ljava/lang/Object;`: Supported.
- `AccessController::doPrivileged(Ljava/security/PrivilegedAction;)Ljava/lang/Object;`: Supported.
- `AccessController::getStackAccessControlContext()Ljava/security/AccessControlContext;`: Not supported. Returns null.

#### util/concurrent/atomic

- `AtomicLong::VMSupportsCS8()Z`: Supported. Returns 1 (we support compare and swap).

### sun

#### misc

- `Perf::createLong(Ljava/lang/String;IIJ)Ljava/nio/ByteBuffer;`: Supported.
- `Signal::findSignal(Ljava/lang/String;)I`: Not supported, returns -1 (not found).
- `URLClassPath::getLookupCacheURLs(Ljava/lang/ClassLoader;)[Ljava/net/URL;`: Not supported, returns null.
- `VM::initialize()V`: Supported, NOP.

#### reflect

- `NativeConstructorAccessorImpl::newInstance0(Ljava/lang/reflect/Constructor;[Ljava/lang/Object;)Ljava/lang/Object;`: Partially supported. Auto unboxing not implemented.
- `NativeMethodAccessorImpl::invoke0(Ljava/lang/reflect/Method;Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;`: Partially supported, wrapping exceptions not implemented.
- `Reflection::getCallerClass()Ljava/lang/Class;`: Supported.
- `Reflection::getClassAccessFlags(Ljava/lang/Class;)I`: Supported.

## Opcodes

All opcodes are supported, with the exception of the below opcodes:

1. Reserved opcodes `impdep1`, `impdep2`, `breakpoint`: not supported.

Some opcodes rely on native implementations, which may not be fully implemented:

1. `invokedynamic`: lambda creation
2. `invokevirtual`: Signature polymorphic methods, resolving the method handle
