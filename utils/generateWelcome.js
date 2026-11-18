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
 * avec avatar à gauche et texte blanc sur fond sombre à motifs colorés.
 */
async function generateWelcomeImage(user, guild) {
  const width = 1200;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // ----- Fond sombre (pas orange) -----
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a1a2e');   // bleu nuit foncé
  gradient.addColorStop(0.5, '#16213e'); // bleu nuit
  gradient.addColorStop(1, '#0f3460');   // bleu royal sombre
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // ----- Motifs de plusieurs couleurs, très épais -----
  const motifColors = [
    'rgba(255, 215, 0, 0.35)',   // or
    'rgba(34, 197, 94, 0.35)',   // vert émeraude
    'rgba(59, 130, 246, 0.35)',  // bleu roi
    'rgba(168, 85, 247, 0.35)',  // violet
    'rgba(251, 146, 60, 0.35)',  // orange
    'rgba(236, 72, 153, 0.35)',  // rose
  ];

  for (let i = 0; i < 8; i++) {
    const cx = (i * 180) % width + 80;
    const cy = (i * 140) % height + 40;
    const r = 50 + i * 30;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = motifColors[i % motifColors.length];
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = motifColors[i % motifColors.length];
    ctx.lineWidth = 10;
    ctx.stroke();
  }

  // Quelques lignes décoratives multicolores très épaisses
  const lineColors = [
    'rgba(255, 215, 0, 0.40)',
    'rgba(34, 197, 94, 0.40)',
    'rgba(59, 130, 246, 0.40)',
    'rgba(168, 85, 247, 0.40)',
  ];
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 100 + 25);
    ctx.lineTo(width, i * 100 + 75);
    ctx.strokeStyle = lineColors[i % lineColors.length];
    ctx.lineWidth = 10;
    ctx.stroke();
  }

  // ----- Avatar à gauche -----
  const fontSizeBienvenue = 130;
  const avatarSize = Math.round(fontSizeBienvenue * 1.25); // avatar proportionnel au texte
  const avatarX = 110;
  const avatarY = height / 2 - avatarSize / 2;
  const textX = avatarX + avatarSize + 140; // décalé à droite de l'avatar

  // Cercle de fond derrière l'avatar
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 16, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.fill();

  // Bordure blanche du cercle avatar
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2);
  ctx.lineWidth = 5;
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

  // ----- Texte (blanc, très gros, décalé à droite) -----
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // "BIENVENUE"
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSizeBienvenue}px ${FONT_FAMILY}`;
  ctx.fillText('BIENVENUE', textX, 145);

  // "sur le serveur Discord"
  ctx.fillStyle = '#ffffff';
  ctx.font = `44px ${FONT_FAMILY}`;
  ctx.fillText('sur le serveur Discord', textX, 275);

  // Nom du serveur (ex: La Kekomnauté)
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 60px ${FONT_FAMILY}`;
  ctx.fillText(guild.name, textX, 345);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'welcome.png' });
}

module.exports = { generateWelcomeImage };