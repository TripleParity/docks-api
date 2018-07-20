# TODO(egeldenhuys): Use multistage build to get rid of g++ and perhaps python

FROM node:9.8.0-alpine

RUN apk add --update python make g++ postgresql-client docker

EXPOSE 8080

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

CMD ["/app/scripts/docks-prod-start.sh"]
