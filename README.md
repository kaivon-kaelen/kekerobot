# Bot Discord

Bot Discord basé sur [discord.js](https://discord.js.org/) v14.

## Prérequis

- Node.js 18+ (installé)
- Un compte Discord et une application créée sur le [Portail Développeur](https://discord.com/developers/applications)

## Installation

Les dépendances sont déjà installées (`node_modules/`). Sinon :

```bash
npm install
```

## Configuration

1. Copiez `.env.example` en `.env` :
   ```bash
   copy .env.example .env
   ```
2. Remplissez `DISCORD_TOKEN`, `CLIENT_ID` et (optionnel) `GUILD_ID`.

## Créer l'application Discord

1. Allez sur https://discord.com/developers/applications
2. **New Application** → donnez un nom.
3. Onglet **Bot** → **Add Bot** → copiez le **Token** dans `DISCORD_TOKEN`.
4. Onglet **General Information** → copiez l'**Application ID** dans `CLIENT_ID`.
5. Onglet **OAuth2 → URL Generator** : cochez `bot` et `applications.commands`, choisissez les permissions, puis utilisez le lien généré pour inviter le bot sur votre serveur.

## Enregistrer les commandes slash

```bash
node deploy-commands.js
```

## Lancer le bot

```bash
npm start
```

### Via Docker Compose

Prérequis : [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré.

```bash
# 1. Configurer le .env (voir section Configuration)
copy .env.example .env

# 2. Enregistrer les commandes slash (une fois, depuis l'hôte)
node deploy-commands.js

# 3. Construire et démarrer
docker compose up -d --build

# Voir les logs
docker compose logs -f

# Arrêter
docker compose down
```

Le conteneur redémarre automatiquement (`restart: unless-stopped`) et persiste les données dans `./data`.

Mode développement (rechargement auto) :

```bash
npm run dev
```

## Mises à jour et changelog

À chaque `push` sur `main`, la CI génère `CHANGELOG.json` depuis l'historique Git et l'embarque dans l'image Docker.

Lorsque le conteneur est mis à jour (par exemple via Arcane), le bot envoie au démarrage un message dans le salon `1369717395811336212` contenant **tous les commits depuis la dernière version annoncée**. La dernière version annoncée est persistée dans `data/changelog-state.json` (volume `./data`), donc un simple redémarrage sans nouvelle image ne renvoie rien.

Le salon peut être surchargé avec `CHANGELOG_CHANNEL_ID` dans le `.env`.

## Annonces de live Twitch

Le bot vérifie périodiquement (toutes les 2 minutes par défaut) si les chaînes configurées sont en direct via l'API Helix de Twitch, et envoie un embed dans `LIVE_CHANNEL_ID` dès qu'un live commence. Aucun webhook ni URL publique n'est nécessaire.

Configuration dans le `.env` :

```env
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
TWITCH_CHANNELS=kekos_yt,une_autre_chaine
LIVE_CHANNEL_ID=1369717395811336212
LIVE_POLL_INTERVAL_MS=120000
```

Crée l'application sur https://dev.twitch.tv/console/apps (OAuth Redirect URL : `http://localhost`). L'état des lives est persisté dans `data/live-state.json`, donc un redémarrage n'annonce pas deux fois le même live. Si les variables Twitch sont absentes, le module se désactive sans rien envoyer.

## Structure

```
discord-bot/
├── commands/        # Commandes slash
├── events/          # Événements Discord
├── index.js         # Point d'entrée
├── deploy-commands.js
├── .env             # Secrets (à créer)
└── package.json
```

## Ajouter une commande

Créez un fichier dans `commands/` exportant `data` (SlashCommandBuilder) et `execute(interaction)`, puis relancez `deploy-commands.js`.
