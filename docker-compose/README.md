# Docker Compose Files

## Build Docks API and Deploy to Swarm

Requires local registry at 127.0.0.1:5000

```
docker build -t 127.0.0.1:5000/docks-api:local ../
docker push 127.0.0.1:5000/docks-api:local
docker stack deploy -c local.yml docks-api
```