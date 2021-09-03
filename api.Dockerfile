FROM node:14-alpine

ENV NODE_ENV production
WORKDIR /app/

COPY ./package*.json ./
COPY ./api ./api

RUN npm ci
RUN echo $APP_PORT

EXPOSE 80

CMD ["npm", "start"]
