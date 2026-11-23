import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const zipFile = path.join(projectRoot, 'beat-me-if-you-can-crazygames.zip');

if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('Error: dist/index.html not found! Run npm run build first.');
  process.exit(1);
}

// Remove old zip if exists
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

console.log('Packaging dist contents directly to root of beat-me-if-you-can-crazygames.zip...');
// Ensure index.html and assets are at the root level inside the zip file
execSync(
  `powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipFile}' -Force"`,
  { stdio: 'inherit' }
);

const stats = fs.statSync(zipFile);
console.log(`\nSuccess! CrazyGames upload package created:`);
console.log(`- Path: ${zipFile}`);
console.log(`- Size: ${(stats.size / 1024).toFixed(1)} KB`);
console.log(`- Ready to upload directly to https://developer.crazygames.com`);
