#!/usr/bin/env bash

uvicorn fastagency.app:app --workers 1 --host 0.0.0.0 --proxy-headers
