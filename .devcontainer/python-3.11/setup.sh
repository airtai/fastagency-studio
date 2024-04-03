# needed to make sure default python is 3.11
sudo ln -s -f /usr/local/bin/python3.11 /usr/bin/python3

# update pip
pip install --upgrade pip

# install dev packages
pip install -e ".[dev]"

# install pre-commit hook if not installed already
pre-commit install
