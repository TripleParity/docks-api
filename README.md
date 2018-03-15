# docks
Implementation of the project

## Development

1. `docker build -f Dockerfile-dev -t docks-development .`
2. `docker run -itv "$(pwd)"/:/app docks-development`