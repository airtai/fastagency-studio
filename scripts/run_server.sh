#!/usr/bin/env bash

prisma migrate deploy
prisma generate --schema=schema.prisma --generator=pyclient

uvicorn fastagency.app:app --workers 8 --host 0.0.0.0 --proxy-headers
