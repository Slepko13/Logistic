FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Зберігаємо лише production залежності
RUN npm prune --omit=dev

FROM node:20-alpine

WORKDIR /app

# Запуск від імені непривілейованого користувача node
RUN chown -R node:node /app
USER node

# Копіюємо лише необхідні файли з builder'а
COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/prisma.config.ts ./

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
