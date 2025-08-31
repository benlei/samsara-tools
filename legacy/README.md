# Legacy Python Implementation

This directory contains the original Python implementation of the samsara-tools banner data extraction system.

## Contents

- **`pull_banners.py`** - Python script for extracting Genshin Impact banner data
- **`pull_hsr_banners.py`** - Python script for extracting Honkai Star Rail banner data
- **`samsara/`** - Python package containing the core banner parsing logic
- **`tests/`** - Python unit tests
- **`test_cli.py`** - Command-line interface tests
- **Python configuration files**: `pyproject.toml`, `poetry.lock`, `pytest.ini`, `Makefile`
- **Python environment files**: `.python-version`, `.venv/`, `.pytest_cache/`

## Migration Note

This Python implementation has been superseded by the TypeScript GitHub Action in the root directory. The legacy Python code is preserved here for reference and comparison purposes.

The TypeScript implementation produces identical YAML output to the Python version while providing better integration with GitHub Actions workflows.

## Usage (Legacy)

```bash
cd legacy
python pull_banners.py --output banners.yml --output-image-dir images
python pull_hsr_banners.py --output hsr_banners.yml --output-image-dir hsr_images
```

Both scripts support the `--skip-images` flag for testing without downloading images.
