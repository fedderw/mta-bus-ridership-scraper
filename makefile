.PHONY: all setup_python setup_node run_python format

all: setup_python setup_node run_python format

setup_python:
	python3.11 -m venv venv
	. venv/bin/activate && pip install -r requirements.txt

setup_node:
	cd node && npm install

run_python:
	. venv/bin/activate && python3.11 main.py

format:
	. venv/bin/activate && black . -l 79 && isort .

test:
	. venv/bin/activate && python -m pytest tests/
