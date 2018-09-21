#!/bin/bash

# Build Docks API image and push to local registry

docker build -t 127.0.0.1:5000/docks-api:local ../
docker push 127.0.0.1:5000/docks-api:local
