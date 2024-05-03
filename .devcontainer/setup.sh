# update pip
pip install --upgrade pip

# install dev packages
pip install -e ".[dev]"

# install pre-commit hook if not installed already
pre-commit install

# install wasp
curl -sSL https://get.wasp-lang.dev/installer.sh | sh

cd app && wasp build && wasp db migrate-dev && cd ..
cat schema.prisma.template ./app/.wasp/build/db/schema.prisma > /tmp/schema.prisma && mv /tmp/schema.prisma schema.prisma
prisma generate --schema=schema.prisma --generator=pyclient
rm schema.prisma
