import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 24, 32, 48, 64, 128, 256];

async function createIco() {
  const inputPath = path.join(__dirname, 'build', 'icon.png');
  const outputPath = path.join(__dirname, 'build', 'icon.ico');
  
  // Create resized PNG buffers
  const pngs = await Promise.all(
    sizes.map(size => 
      sharp(inputPath)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );
  
  // Create ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(sizes.length, 4); // Number of images
  
  // Create directory entries
  const dirEntries = [];
  let dataOffset = 6 + (16 * sizes.length);
  
  for (let i = 0; i < sizes.length; i++) {
    const entry = Buffer.alloc(16);
    const size = sizes[i] >= 256 ? 0 : sizes[i];
    entry.writeUInt8(size, 0); // Width
    entry.writeUInt8(size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(pngs[i].length, 8); // Image size
    entry.writeUInt32LE(dataOffset, 12); // Offset
    dirEntries.push(entry);
    dataOffset += pngs[i].length;
  }
  
  // Combine all buffers
  const ico = Buffer.concat([header, ...dirEntries, ...pngs]);
  fs.writeFileSync(outputPath, ico);
  
  console.log('Created icon.ico with sizes:', sizes.join(', '));
}

createIco().catch(console.error);
