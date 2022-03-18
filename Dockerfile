FROM node:17-slim

RUN apt-get update \
  && apt-get install -y sox libsox-fmt-mp3

WORKDIR /spotify-radio/

COPY package.json yarn.lock /spotify-radio/

RUN rm -rf package.lock.json \
  && yarn install --frozen-lockfile --silent

COPY . .

USER node

CMD yarn live-reload