SHELL := /bin/bash
PYTHON_VERSION = 3.11.1

default:

setup:
	pyenv install -s $(PYTHON_VERSION)
	pyenv local $(PYTHON_VERSION)
	poetry config virtualenvs.in-project true
	[ -d .venv ] && poetry env info | grep "`pyenv local`" || rm -rf .venv
	poetry env use "`pyenv which python`"
	poetry install

test:
	poetry run pytest

format:
	poetry run black