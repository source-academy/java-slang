# java-slang

Open-source Implementation of the Java language in TypeScript. (<https://docs.oracle.com/javase/specs/>).

## Table of Contents

- [java-slang](#java-slang)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Usage](#usage)
  - [Testing](#testing)
  - [Using your java-slang in Source Academy](#using-your-java-slang-in-source-academy)
  - [Using your java-slang in your local Source Academy](#using-your-java-slang-in-your-local-source-academy)
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


## Testing

`java-slang` comes with an extensive test suite. To run the tests after you made your modifications, run `yarn test`. Regression tests are run automatically when you want to push changes to this repository. The regression tests are generated using `jest` and stored as snapshots in `src/\_\_tests\_\_`. After modifying `java-slang`, carefully inspect any failing regression tests reported in red in the command line. If you are convinced that the regression tests and not your changes are at fault, you can update the regression tests as follows:

```bash
$ yarn global add jest
$ yarn test --updateSnapshot
```

## Using your java-slang in Source Academy

java-slang is used by the [Source Academy](https://sourceacademy.org), the immersive online experiential environment for learning programming. For this, java-slang is [deployed as an NPM package](https://www.npmjs.com/package/java-slang). The frontend of the Source Academy then includes the java-slang package in its deployment bundle.

## Using your java-slang in your local Source Academy

A common issue when developing modifications to java-slang is how to test it using your own local frontend. Assume that you have built your own frontend locally, here is how you can make it use your own java-slang, instead of the one that the Source Academy team has deployed to npm.

First, build and link your local java-slang:

```bash
$ cd java-slang
$ yarn build
$ yarn link
```

Then, from your local copy of frontend:

```bash
$ cd frontend
$ yarn link path/to/java-slang
```

Replace "path/to/java-slang" with the path to the java-slang repository. After running the command, start the frontend and the new java-slang will be used.

## License

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

All sources in this repository are licensed under the [Apache License Version 2][apache2].

[apache2]: https://www.apache.org/licenses/LICENSE-2.0.txt
