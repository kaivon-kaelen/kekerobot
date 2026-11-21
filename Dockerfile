FROM node:22-alpine

WORKDIR /app

# ffmpeg et yt-dlp sont nécessaires pour la musique
RUN apk add --no-cache ffmpeg python3 py3-pip && pip install --break-system-packages yt-dlp

# Installer les dépendances d'abord (cache Docker)
COPY package*.json ./
RUN npm ci --omit=dev

# Copier le code source
COPY . .

# Répertoire de données writable
RUN mkdir -p /app/data && chmod 777 /app/data

CMD ["node", "index.js"]
