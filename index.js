require('dotenv').config();

const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const { Partials } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User],
});

// Évite qu'une erreur non gérée (ex. interaction expirée) fasse tomber le processus
client.on('error', (error) => {
  console.error('[client] Erreur non gérée :', error?.message || error);
});

client.commands = new Collection();

// Charger les commandes
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[AVERTISSEMENT] La commande ${filePath} manque "data" ou "execute".`);
    }
  }
}

// Charger les événements
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
  console.log('[index] Événements chargés :', eventFiles.map((f) => f.replace('.js','')).join(', '));
}

// Redéployer automatiquement les commandes slash au démarrage
const { REST, Routes } = require('discord.js');

const builtCommands = [];
client.commands.forEach((command) => {
  if (command.data) builtCommands.push(command.data.toJSON());
});

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`[deploy] Enregistrement de ${builtCommands.length} commande(s) au démarrage...`);
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: builtCommands },
      );
      console.log('[deploy] Commandes enregistrées sur le serveur (instantané).');
    } else {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: builtCommands });
      console.log('[deploy] Commandes enregistrées globalement (peut prendre jusqu\'à 1h).');
    }
  } catch (error) {
    console.error('[deploy] Échec de l\'enregistrement des commandes :', error);
  }
})();

client.login(process.env.DISCORD_TOKEN);
