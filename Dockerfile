FROM node:22-alpine

WORKDIR /app

# ffmpeg est nécessaire pour convertir les flux audio en Opus
RUN apk add --no-cache ffmpeg

# Installer les dépendances d'abord (cache Docker)
COPY package*.json ./
RUN npm ci --omit=dev

# Copier le code source
COPY . .

# Répertoire de données writable
RUN mkdir -p /app/data && chmod 777 /app/data

CMD ["node", "index.js"]
