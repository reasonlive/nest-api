FROM node:22.21.0-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client netcat-openbsd

COPY package*.json ./
ENV NPM_CONFIG_TIMEOUT=120000

RUN npm ci

COPY . .

RUN npm run build

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

CMD ["npm", "run", "start:prod"]