# BUILD
FROM node:18.16-alpine As build

RUN apk add git

WORKDIR /usr/src/app

COPY --chown=node:node . .

RUN yarn install

RUN yarn generate
