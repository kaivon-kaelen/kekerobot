const { getMappingByUserMessage, getMappingByThreadMessage } = require('../utils/modmail-messages');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;
    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }
    const message = reaction.message.partial ? await reaction.message.fetch().catch(() => null) : reaction.message;
    if (!message) return;

    const emoji = reaction.emoji;

    // Réaction dans un MP sur un message mappé -> reporter sur le message du thread
    if (message.channel.type === 1) { // DM
      const mapping = getMappingByUserMessage(message.id);
      if (!mapping) return;
      try {
        const threadChannel = await message.client.channels.fetch(mapping.threadId);
        const threadMsg = await threadChannel.messages.fetch(mapping.threadMessageId);
        await threadMsg.react(emoji).catch(() => {});
      } catch {}
      return;
    }

    // Réaction dans un thread du forum -> reporter sur le message MP
    if (message.channel.isThread && message.channel.isThread()) {
      const mapping = getMappingByThreadMessage(message.id);
      if (!mapping) return;
      try {
        const dmUser = await message.client.users.fetch(mapping.userId);
        const dmChannel = await dmUser.createDM();
        const dmMsg = await dmChannel.messages.fetch(mapping.userMessageId);
        await dmMsg.react(emoji).catch(() => {});
      } catch {}
      return;
    }
  },
};
