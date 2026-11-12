# java-slang

Open-source Implementation of the Java language in TypeScript. (<https://docs.oracle.com/javase/specs/>).

## Table of Contents

- [java-slang](#java-slang)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Usage](#usage)
  - [Current Features](#current-features)
  - [Future Features](#future-features)
  - [Testing](#testing)
  - [How java-slang is used in Source Academy](#how-java-slang-is-used-in-source-academy)
  - [Using your local java-slang in Source Academy](#using-your-local-java-slang-in-source-academy)
  - [License](#license)

## Prerequisites

- NodeJS v22
- Python: On MacBook Pro with chip Apple M1 Pro, use python 3.10.12. Here is [the correct way to set Python 3 as default on a Mac](https://opensource.com/article/19/5/python-3-default-mac).
- yarn: use the version specified in `package.json`. On macos, you may need to run `corepack enable`.

## Usage

To build,

```bash
$ git clone --recurse-submodules https://github.com/source-academy/java-slang.git
$ cd java-slang
$ yarn
$ yarn build
```

This repository uses git submodules. To update existing repositories with a submodule,

```bash
# Init is only required on the very first time.
$ git submodule update --init --recursive
# Required subsequently every time you want to update the submodules.
$ git submodule update --recursive --remote
```

## Current Features

The Java language in Source Academy is based on the [Java 8 SE](https://docs.oracle.com/javase/specs/jls/se8/html/index.html) and currently supports a host of available features, including:

- Primitive classes: boolean, byte, short, int, long, char, float and double.
- Custom (non-primitive) classes
- Method overloading
- Exception handling
- Implicit type widening
- Explicit type conversion
- Basic exception/error messages
- Many standard libraries including system calls e.g. `System.out.println`
- Static nested classes
- Switch statements
- Multiple classes in one file
- Inheritance
- Abstract classes

## Future Features

- Generics
- Multi-file programs
- Interfaces
- Explicit constructor invocation using `super(...)` and `this(...)`
- Possible upgrading to follow newer versions of Java, e.g. 15

## Testing

`java-slang` comes with an extensive test suite. To run the tests after you made your modifications, run `yarn test`. Regression tests are run automatically when you want to push changes to this repository. The regression tests are generated using `jest` and stored as snapshots in `src/\_\_tests\_\_`. After modifying `java-slang`, carefully inspect any failing regression tests reported in red in the command line. If you are convinced that the regression tests and not your changes are at fault, you can update the regression tests as follows:

```bash
$ yarn global add jest
$ yarn test --updateSnapshot
```

## How java-slang is used in Source Academy

java-slang is used by the [Source Academy](https://sourceacademy.org), the immersive online experiential environment for learning programming. For this, java-slang is deployed in Conductor. The frontend of the Source Academy then includes the java-slang package in its deployment bundle.

## Using your local java-slang in Source Academy

A common issue when developing modifications to java-slang is how to test it. With the migration to Conductor and consequent deprecation of the npm package, the optimal way to test java-slang now is through creating your own Conductor build and linking it to the live frontend at https://sourceacademy.org/playground. Below are the steps.

1. Fork this java-slang repo and all its branches to your own repository.

2. Go to Settings -> Pages in the forked repo and choose to deploy using Github Actions. 

3. After the initial build is finished (should take a few minutes), check that the repo has been deployed at "{Github Page URL of forked java-slang repo}/index.js". You can find the Github Page URL by clicking on Deployments/github-pages on the right sidebar of the forked repo. Note that you must add "/index.js" to the end when checking at the URL, and it should not display a 404 error there but rather a text dump.

3. Next, fork the [language-directory](https://github.com/source-academy/language-directory) repo and all its branches to your own repository. Similarly choose to deploy using Github Actions.

4. In the src/languages/java/index.ts file of the forked language-directory repo, replace the javaDefault path with the GH Pages URL of your deployed java-slang repo (including the index.js part).

5. Check that the language directory repo has been deployed on Github Pages at "{Github Page URL of forked language-directory repo}/directory.json" by visiting it. You should see a JSON dump instead of a 404 error.

6. In the frontend, go to Settings -> Feature Flags and change the language directory URL to the one in step 5. Do not click the reload button next to the flag, that resets it to the [default language directory](https://source-academy.github.io/language-directory/directory.json).

7. To test local changes, simply push them to your forked java-slang repo and the changes will automatically show up in the frontend within a few minutes (recommended to refresh the page before attempting to test them).

8. If you are utilising a branch other than main in your forked java-slang repo, do note that you will need to add the name of the branch in the build-deploy file in .github/workflows in order for the changes to be reflected in your Conductor build. You only need to do this inside the branch itself, once per branch creation (so that future builds in that branch will recognise that its code should be used).

## License

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

All sources in this repository are licensed under the [Apache License Version 2][apache2].

[apache2]: https://www.apache.org/licenses/LICENSE-2.0.txt
