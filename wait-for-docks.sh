#!/bin/sh

set -e

host=$1

# Wait for postgresql to be functional
until curl $host; do
  >&2 echo "Docks is unavailable - sleeping"
  sleep 1
done

echo "Docks is ready"