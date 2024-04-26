# update pip
pip install --upgrade pip

# install dev packages
pip install -e ".[dev]"

# install pre-commit hook if not installed already
pre-commit install

# install wasp
curl -sSL https://get.wasp-lang.dev/installer.sh | sh
