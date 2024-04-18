#!/usr/bin/env bash

uvicorn fastagency.app:app --workers 8 --host 0.0.0.0 --proxy-headers
