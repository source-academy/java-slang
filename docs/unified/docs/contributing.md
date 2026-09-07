# Contributing

### First-Time Setup

Requirements:

- Python `≥3.9.6`
- [`virtualenv`](https://virtualenv.pypa.io/en/latest/installation.html) (or any virtual environment manager of choice)

**Configuring virtual environment**

1. Navigate to `java-slang/docs/unified`.
2. Create new virtual environment: `python -m virtualenv .venv`.
3. Move into virtual environment: `source .venv/bin/activate`.
4. Get dependencies: `pip install -r requirements.txt`.

The virtual environment may be exited with `deactivate`.

### Development

_All commands here, unless otherwise stated, are run in the virtual environment and from the docs root `java-slang/docs/unified/docs`._

**Build**: `mkdocs build`

**Run Live Server (Offline)**: `mkdocs serve`

See relevant documentation:

- [Markdown](https://daringfireball.net/projects/markdown/)
- [Material](https://squidfunk.github.io/mkdocs-material/reference/) (for added components)
