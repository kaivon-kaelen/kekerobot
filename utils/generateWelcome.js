const { createCanvas, loadImage, registerFont } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');

// Police embarquée : place un fichier .ttf dans assets/fonts/DejaVuSans.ttf
const FONT_PATH = path.join(__dirname, '..', 'assets', 'fonts', 'DejaVuSans.ttf');
if (fs.existsSync(FONT_PATH)) {
  registerFont(FONT_PATH, { family: 'WelcomeFont' });
}

const FONT_FAMILY = fs.existsSync(FONT_PATH) ? 'WelcomeFont' : 'sans-serif';

/**
 * Génère une image de bienvenue style "banner horizontal"
 * avec avatar à gauche et texte blanc sur fond à motifs.
 */
async function generateWelcomeImage(user, guild) {
  const width = 1200;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // ----- Fond avec motifs -----
  ctx.fillStyle = '#c75c4a';
  ctx.fillRect(0, 0, width, height);

  // Motifs : cercles concentriques décalés en arrière-plan
  for (let i = 0; i < 6; i++) {
    const cx = (i * 210) % width + 100;
    const cy = (i * 170) % height + 50;
    const r = 60 + i * 25;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Quelques lignes décoratives fines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 100 + 30);
    ctx.lineTo(width, i * 100 + 80);
    ctx.stroke();
  }

  // ----- Avatar à gauche -----
  const avatarSize = 180;
  const avatarX = 110;
  const avatarY = height / 2 - avatarSize / 2;

  // Cercle de fond derrière l'avatar
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fill();

  // Bordure blanche du cercle avatar
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Masque circulaire pour l'avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();

  const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 512 });
  const avatar = await loadImage(avatarUrl);
  ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  // ----- Texte -----
  const textX = avatarX + avatarSize + 50; // à droite de l'avatar

  ctx.textBaseline = 'middle';

  // "Bienvenue"
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 96px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText('Bienvenue', textX, 145);

  // "sur le serveur Discord"
  ctx.fillStyle = '#ffe3d9';
  ctx.font = `36px ${FONT_FAMILY}`;
  ctx.fillText('sur le serveur Discord', textX, 205);

  // Nom du serveur (ex: La Kekomnauté)
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 48px ${FONT_FAMILY}`;
  ctx.fillText(guild.name, textX, 270);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'welcome.png' });
}

module.exports = { generateWelcomeImage };