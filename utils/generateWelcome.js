const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');

// Police embarquée : assets/fonts/WelcomeFont.ttf (Bebas Neue, style gras et moderne)
const FONT_PATH = path.join(__dirname, '..', 'assets', 'fonts', 'WelcomeFont.ttf');
const FONT_FAMILY = 'WelcomeFont';
if (fs.existsSync(FONT_PATH)) {
  GlobalFonts.registerFromPath(FONT_PATH, FONT_FAMILY);
}

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

  // Motifs de plusieurs couleurs en arrière-plan (plus épais)
  const motifColors = [
    'rgba(255, 215, 0, 0.15)',   // or
    'rgba(34, 197, 94, 0.15)',   // vert
    'rgba(59, 130, 246, 0.15)',  // bleu
    'rgba(168, 85, 247, 0.15)',  // violet
    'rgba(251, 146, 60, 0.15)',  // orange
    'rgba(236, 72, 153, 0.15)',  // rose
  ];

  for (let i = 0; i < 8; i++) {
    const cx = (i * 180) % width + 80;
    const cy = (i * 140) % height + 40;
    const r = 50 + i * 30;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = motifColors[i % motifColors.length];
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = motifColors[i % motifColors.length];
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Quelques lignes décoratives multicolores plus épaisses
  const lineColors = [
    'rgba(255, 215, 0, 0.18)',
    'rgba(34, 197, 94, 0.18)',
    'rgba(59, 130, 246, 0.18)',
    'rgba(168, 85, 247, 0.18)',
  ];
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 100 + 25);
    ctx.lineTo(width, i * 100 + 75);
    ctx.strokeStyle = lineColors[i % lineColors.length];
    ctx.lineWidth = 4;
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
  const textX = avatarX + avatarSize + 180; // bien plus à droite

  ctx.textBaseline = 'middle';

  // "Bienvenue" en blanc
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 96px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText('Bienvenue', textX, 145);

  // "sur le serveur Discord" en blanc
  ctx.fillStyle = '#ffffff';
  ctx.font = `36px ${FONT_FAMILY}`;
  ctx.fillText('sur le serveur Discord', textX, 205);

  // Nom du serveur en blanc
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 48px ${FONT_FAMILY}`;
  ctx.fillText(guild.name, textX, 270);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'welcome.png' });
}

module.exports = { generateWelcomeImage };