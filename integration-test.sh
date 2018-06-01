#!/bin/sh

sudo docker-compose -f docker-compose.yml -f docker-compose.local.yml up --force-recreate --build -d

npm run-script jest
return=$?

sudo docker-compose down -v

exit $return