FROM node:22-alpine

WORKDIR /app

# Installer les dépendances d'abord (cache Docker)
COPY package*.json ./
RUN npm ci --omit=dev

# Copier le code source
COPY . .

# L'utilisateur non-root pour la sécurité
RUN addgroup -S bot && adduser -S bot -G bot && chown -R bot:bot /app
USER bot

CMD ["node", "index.js"]
