#!/bin/sh

# Test if the Docker socket file exists
if test -S "/var/run/docker.sock";
then
    echo "Found Docker socket file.";
else
    echo "Docker socket file not found. Please mount /var/run/docker.sock">&2;
    exit 1;
fi

DEBUG=docks:* NODE_ENV=development PORT=8080 npm run production