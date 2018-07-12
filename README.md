# Docks API

Provides a http proxy to the Docker API at `localhost:8080/docker`. For more information,
view [the Docker API documentation.](https://docs.docker.com/engine/api/v1.37)

An example of interacting with the docks api:
`curl http://localhost:8080/docker/containers/json`

## Requirements
- Linux or MacOs
- Docker
- Docker-Compose (if you want to use the `docker-compose.yml` for development)

## Deployment
Docks API can be deployed with:
```
$ docker run -d -p 8080:8080 --name docks-api -v /var/run/docker.sock:/var/run/docker.sock tripleparity/docks-api
```

To stop the running container:
```
$ docker stop docks-api
```

## Development
If you use the included Docker file for development, there is no need to install NodeJS on your local machine.

The included Development docker-compose file will run the Docks API on port 8080:

`$ docker-compose up`

If you prefer to run it manually, you can start the API with:
1. `docker build -f Dockerfile-dev -t docks-development .`
2. `docker run -it -v "$(pwd)"/:/app -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock docks-development `

When the development image runs (step 2), npm will check for any updates. The Express server will automatically
reload as you edit local files.

Note: currently, the development container will set the ownership of the `node_modules` folder and all installed
packages to root if they don't exist (pure Docker workflow).
