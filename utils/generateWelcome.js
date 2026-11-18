const { createCanvas, loadImage, registerFont } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');

// Optionnel : charger une police personnalisée si présente
try {
  registerFont('./assets/fonts/Bold.ttf', { family: 'WelcomeFont' });
} catch {
  // Police système par défaut
}

async function generateWelcomeImage(user, guild) {
  const width = 1024;
  const height = 512;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fond sombre
  ctx.fillStyle = '#2b2d31';
  ctx.fillRect(0, 0, width, height);

  // Cercle de couleur derrière l'avatar
  ctx.beginPath();
  ctx.arc(width / 2, height / 2 - 40, 125, 0, Math.PI * 2);
  ctx.fillStyle = '#5865f2';
  ctx.fill();

  // Bordure blanche du cercle
  ctx.beginPath();
  ctx.arc(width / 2, height / 2 - 40, 125, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Avatar de l'utilisateur
  const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 512 });
  const avatar = await loadImage(avatarUrl);

  // Masque circulaire pour l'avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(width / 2, height / 2 - 40, 100, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, width / 2 - 100, height / 2 - 140, 200, 200);
  ctx.restore();

  // Texte : pseudo de l'utilisateur
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(user.username, width / 2, height / 2 + 125);

  // Texte : nom du serveur
  ctx.fillStyle = '#99aab5';
  ctx.font = '28px sans-serif';
  ctx.fillText(`Bienvenue sur ${guild.name}`, width / 2, height / 2 + 170);

  // Ligne séparatrice
  ctx.beginPath();
  ctx.moveTo(width / 2 - 150, height / 2 + 200);
  ctx.lineTo(width / 2 + 150, height / 2 + 200);
  ctx.strokeStyle = '#5865f2';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Texte : membre numéro
  ctx.fillStyle = '#99aab5';
  ctx.font = '22px sans-serif';
  ctx.fillText(`Membre #${guild.memberCount}`, width / 2, height / 2 + 240);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'welcome.png' });
}

module.exports = { generateWelcomeImage };