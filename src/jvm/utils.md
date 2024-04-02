# JVM utils

This document serves to document helper functions that may be useful for the integration of the JVM.

- `disassembler::parseBin`: parses a `DataView` of an `ArrayBuffer` containing a binary class file into a `ClassFile` object.
- `j2jsString`: converts a Java `String` object into a JavaScript string.
- `js2jString`: converts a JavaScript string into a Java `String` object. Assumes `String` has been initialized.
- `integration::loadCachedFiles`: Loads cached class files from `IndexedDB`. If missing, imports class files from the compiled class file strings (See *converting class files to strings* in readme on how to generate classfiles).
- `integration::createModuleProxy`: creates a Proxy that attempts to map Java native functions (e.g. `show(LRune;)V`) to JavaScript functions (e.g. `show(...)`). Attempts to autobox/unbox objects into their Java/JavaScript equivalent.