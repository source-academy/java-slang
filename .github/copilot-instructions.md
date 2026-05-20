# Copilot Instructions for java-slang

## What this repo is
- A TypeScript implementation of a Java subset used by Source Academy.
- Two execution models are present: the source-level evaluator in `src/ec-evaluator`, and the JVM bytecode runtime in `src/jvm`.
- The compiler lives in `src/compiler` and emits `ClassFile` objects defined under `src/ClassFile/types`.

## Primary workflows
- Build: `yarn build`
- Test: `yarn test`
- Watch tests: `yarn test:watch`
- Lint: `yarn eslint`
- Format: `yarn format`
- Generate docs: `yarn jsdoc`

## Key entrypoints
- `src/index.ts` exports the public API: `astToString`, `ECE`, `JVM`, `typeCheck`, `compile`, `compileFromSource`.
- `src/compiler/index.ts` is the compiler entrypoint; `compileFromSource` parses Java text with `peggy` and then compiles the AST.
- `src/ec-evaluator/index.ts` is the source-level interpreter entrypoint; use `runECEvaluator(code, targetStep)`.
- `src/jvm/index.ts` is the JVM bootstrap entrypoint; use `setupJVM(...)` and then call the returned `runJVM()`.

## Architecture and boundaries
- `src/ast`: parser and AST utilities for the Java subset.
- `src/compiler`: parser grammar, compiler, and classfile generation.
- `src/ClassFile`: bytecode metadata types for class files.
- `src/jvm`: JVM runtime, class loading, JNI/native integration, threadpool, and unsafe heap.
- `src/ec-evaluator`: an alternative evaluator for source Java semantics, separate from the JVM runtime.
- `src/types`: shared type-checking and semantic utilities used by the package API.

## JVM-specific patterns
- JVM setup is callback-driven. `src/jvm/index.ts` expects callbacks for:
  - `readFileSync(path): ClassFile`
  - `readFile(path): Promise<any>`
  - `stdout(message)` and `stderr(message)`
  - optional `onFinish()`
- Native methods are loaded via JNI and may be deferred. See `src/jvm/jni.ts` and `src/jvm/README.md`.
- The JVM uses a bootstrap/application classloader model. `src/jvm/ClassLoader/AbstractClassLoader.ts` defines parent delegation and class loading.
- `src/jvm/utils/CustomSystem.ts` adapts host I/O and module loading into the JVM runtime.

## Project-specific conventions
- All runtime entrypoints are named explicitly and exported from `src/index.ts`.
- The repository expects TypeScript compile output to land in `dist/`; `package.json` uses `tsc --build --force`.
- The codebase uses `yarn` uniformly for install/build/test rather than raw `npm`.
- Tests are located alongside source in `src/**/__tests__`; root-level Jest config is `jest.config.js`.

## Useful file references
- Compiler grammar and parser helpers: `src/compiler/grammar.ts`, `src/compiler/peggy-functions.ts`
- JVM runtime orchestration: `src/jvm/jvm.ts`
- Native/JNI patterns: `src/jvm/jni.ts`, `src/jvm/README.md`
- Class loading and bytecode model: `src/jvm/ClassLoader/AbstractClassLoader.ts`, `src/ClassFile/types`
- Source-level execution: `src/ec-evaluator/index.ts`

## Notes for changes
- Changes to the compiler should preserve the `ClassFile` model and should be cross-checked against both compiler tests and JVM runtime behavior.
- For JVM work, keep the callback contract stable: `readFileSync` returns parsed `ClassFile`, and native load paths are resolved by `nativesPath` / `javaClassPath`.
- Do not assume the interpreter and JVM behavior are identical; `src/ec-evaluator` is deliberately separate from `src/jvm`.

## If you want to extend this guidance
- Add examples of actual repository-specific small refactors or bugfix patterns discovered during work.
- Document any non-obvious `yarn` or submodule workflow if it becomes required for development.
