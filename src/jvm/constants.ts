export enum ThreadStatus {
  NEW,
  RUNNABLE,
  BLOCKED,
  WAITING,
  TIMED_WAITING,
  TERMINATED,
}

export enum MethodHandleReferenceKind {
  REF_getField = 1,
  REF_getStatic = 2,
  REF_putField = 3,
  REF_putStatic = 4,
  REF_invokeVirtual = 5,
  REF_invokeStatic = 6,
  REF_invokeSpecial = 7,
  REF_newInvokeSpecial = 8,
  REF_invokeInterface = 9,
}

export enum MemberNameFlags {
  MN_IS_METHOD = 0x00010000, // method (not constructor)
  MN_IS_CONSTRUCTOR = 0x00020000, // constructor
  MN_IS_FIELD = 0x00040000, // field
  MN_IS_TYPE = 0x00080000, // nested type
  MN_CALLER_SENSITIVE = 0x00100000, // @CallerSensitive annotation detected
  MN_TRUSTED_FINAL = 0x00200000, // trusted final field
  MN_HIDDEN_MEMBER = 0x00400000, // members defined in a hidden class or with @Hidden
  MN_REFERENCE_KIND_SHIFT = 24, // refKind
  MN_REFERENCE_KIND_MASK = 0x0f000000 >> MN_REFERENCE_KIND_SHIFT,
}

export enum CLASS_STATUS {
  PREPARED,
  INITIALIZING,
  INITIALIZED,
  ERROR,
}

export enum CLASS_TYPE {
  REFERENCE,
  ARRAY,
  PRIMITIVE,
}

export enum CLASS_FLAGS {
  ACC_PUBLIC = 0x0001,
  ACC_FINAL = 0x0010,
  ACC_SUPER = 0x0020,
  ACC_INTERFACE = 0x0200,
  ACC_ABSTRACT = 0x0400,
  ACC_SYNTHETIC = 0x1000,
  ACC_ANNOTATION = 0x2000,
  ACC_ENUM = 0x4000,
  ACC_MODULE = 0x8000,
}
