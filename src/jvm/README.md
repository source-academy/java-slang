# JVM setup

1. call `setupJVM` in `index.ts`. It returns a function `runJVM`. `setupJVM` accepts optional parameters:
   1. `javaClassPath`: path to search for java class files (standard library).
   2. `nativesPath`: path to search for native function implementations (standard library).
   3. `callbacks`:
      1. `readFileSync`: used to read class files. Takes in a path (e.g. `javaClassPath/java/lang/Class.class`) and returns a `ClassFile` object.
      2. `readFile`: used to read native libraries. takes in a path (e.g. `java/lang/Class`) and returns a `Lib` object.
      3. `stdout`: stdout buffer for printing
      4. `stderr`: stderr buffer for exception printing
      5. `onFinish`: callback for when the JVM has shut down
   4. `natives`: native libraries to load into the JNI at startup. More of a conveinience function since `readFile` can load it at runtime.
2. call `runJVM`.

## example

```js
const runJVM = setupJVM({
  javaClassPath: "",
  nativesPath: "",
  callbacks: {
    readFileSync: (path: string) => compilerOutput.files[path],
    readFile: (path: string) => import(`java-slang/bin/stdlib/${path}.js`),
    stdout: console.log,
    stderr: console.err,
    onFinish: () => console.log(0),
  },
  natives: lib,
});
runJVM();
```

## writing native libraries

The native implementation of native methods of a java class is exported as an object.
The key is the function signature and the value is the implementation. An example module is shown below:

```js
export const functions = {
  "display(I)V": (thread: Thread, locals: any[]) => {
    const system = thread.getJVM().getSystem();
    system.stdout(locals[0]);
    thread.returnStackFrame();
  },
};
```
