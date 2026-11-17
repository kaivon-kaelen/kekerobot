require('dotenv').config();

const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    // Supprimer les commandes globales
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    console.log('Commandes globales supprimées.');

    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
      console.log(`Commandes du serveur ${process.env.GUILD_ID} supprimées.`);
    }
  } catch (error) {
    console.error(error);
  }
})();
