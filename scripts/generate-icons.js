#!/usr/bin/env node
/**
 * Generate PWA icons from SVG
 * Run: node scripts/generate-icons.js
 * Requires: npm install sharp (optional - creates PNG from SVG)
 */
const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, '../client');
const iconsDir = path.join(clientDir, 'icons');

// Minimal 192x192 PNG (1x1 red pixel scaled - we'll create simple colored squares)
// Using a simple approach: copy SVG as fallback, try sharp for PNG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#e94560"/>
  <text x="256" y="340" font-size="200" text-anchor="middle" fill="white" font-family="Arial">L</text>
</svg>`;

try {
  const sharp = require('sharp');
  const svgBuffer = Buffer.from(svgContent);
  
  sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'))
    .then(() => sharp(svgBuffer).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png')))
    .then(() => console.log('Icons generated successfully!'))
    .catch(err => { throw err; });
} catch (e) {
  console.log('Sharp not installed. Creating SVG fallback. Run: npm install sharp');
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);
}
