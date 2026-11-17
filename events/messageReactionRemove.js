const { getMappingByUserMessage, getMappingByThreadMessage } = require('../utils/modmail-messages');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user) {
    if (user.bot) return;
    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }
    const message = reaction.message.partial ? await reaction.message.fetch().catch(() => null) : reaction.message;
    if (!message) return;

    const emoji = reaction.emoji;

    if (message.channel.type === 1) { // DM
      const mapping = getMappingByUserMessage(message.id);
      if (!mapping) return;
      try {
        const threadChannel = await message.client.channels.fetch(mapping.threadId);
        const threadMsg = await threadChannel.messages.fetch(mapping.threadMessageId);
        const r = threadMsg.reactions.cache.get(emoji.id || emoji.name);
        if (r) await r.users.remove(message.client.user.id).catch(() => {});
        // remove user reaction counterpart? We remove the same emoji reaction entirely? 
        // Better: remove the bot's? Actually sync removal means remove emoji from counterpart if no other users.
        // Simpler: remove reaction from counterpart.
        await threadMsg.reactions.resolve(emoji)?.remove().catch(() => {});
      } catch {}
      return;
    }

    if (message.channel.isThread && message.channel.isThread()) {
      const mapping = getMappingByThreadMessage(message.id);
      if (!mapping) return;
      try {
        const dmUser = await message.client.users.fetch(mapping.userId);
        const dmChannel = await dmUser.createDM();
        const dmMsg = await dmChannel.messages.fetch(mapping.userMessageId);
        await dmMsg.reactions.resolve(emoji)?.remove().catch(() => {});
      } catch {}
      return;
    }
  },
};
