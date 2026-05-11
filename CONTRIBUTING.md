# Contributing

## Pre-commit Hooks

This project uses [pre-commit](https://pre-commit.com) to run automated checks before
each commit — trailing whitespace, YAML validation, large file detection, secret
scanning, and more.

### Setup

1. Install pre-commit:

   ```bash
   pip install pre-commit
   ```

2. Install the hooks into your local clone:

   ```bash
   pre-commit install
   ```

That's it. The hooks will run automatically on every `git commit`. To run them
manually at any time:

```bash
pre-commit run --all-files
```
