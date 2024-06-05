#!/usr/bin/env bash

prisma migrate deploy
prisma generate --schema=schema.prisma --generator=pyclient

faststream run fastagency.io.ionats:app --workers 2 > faststream.log 2>&1 &

uvicorn fastagency.weather_app:weather_app --workers 1 --host 0.0.0.0 --port 9001 --proxy-headers > weather_app.log 2>&1 &

uvicorn fastagency.app:app --workers 2 --host 0.0.0.0 --proxy-headers
