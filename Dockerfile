FROM node:9.8.0-alpine

MAINTAINER TripleParity

RUN apk add --update python make g++ postgresql-client

EXPOSE 8080

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

CMD ["/app/scripts/docks-prod-start.sh"]