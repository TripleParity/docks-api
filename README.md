# docks
Implementation of the project

## Development

1. `docker build -f Dockerfile-dev -t docks-development .`
2. `docker run -it -v "$(pwd)"/:/app -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock docks-development `