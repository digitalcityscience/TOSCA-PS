FROM node:lts

RUN apt-get update
RUN apt-get install -y chromium

WORKDIR /app

COPY package* /app
COPY src /app/src

RUN npm ci

CMD node src/index.js
