# docks
Implementation of the project

Provides a http proxy to the Docker API at `localhost:8080/docker`. For more information,
view [the Docker API documentation.](https://docs.docker.com/engine/api/v1.37)

An example of interacting with the docks api:
`curl http://localhost:8080/docker/containers/json`

## Development
If you use the included Docker file for development, there is no need to install NodeJS on your local machine.
1. `docker build -f Dockerfile-dev -t docks-development .`
2. `docker run -it -v "$(pwd)"/:/app -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock docks-development `

When the development image runs (step 2), npm will check for any updates. The Express server will automatically
reload as you edit local files.

Note: currently, the development container will set the ownership of the `node_modules` folder and all installed
packages to root if they don't exist (pure Docker workflow).

## Production
1. `docker build -f Dockerfile-prod -t docks-production .`
2. `docker run -it -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock docks-production `
