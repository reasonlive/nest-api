FROM node:22.21.0-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client netcat-openbsd

COPY package*.json ./
ENV NPM_CONFIG_TIMEOUT=120000

RUN npm ci

COPY . .

RUN npm run build
# Копируем .env.example если .env не существует
RUN if [ ! -f .env ]; then cp .env.example .env; fi

# Делаем скрипты исполняемыми (если они есть)
RUN if [ -f reset-db.sh ]; then chmod +x reset-db.sh; fi

EXPOSE 3000

CMD ["npm", "run", "start:prod"]