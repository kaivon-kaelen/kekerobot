// Stockage en mémoire des MP en attente de confirmation
const pending = new Map(); // userId -> { messageId, content, attachmentUrls, dmChannelId }
module.exports = pending;
