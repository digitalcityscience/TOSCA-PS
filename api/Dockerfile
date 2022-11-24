FROM node:lts

WORKDIR /app

COPY package* /app
COPY src /app/src

RUN npm ci

CMD node src/index.js
