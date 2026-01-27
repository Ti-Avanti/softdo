import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pngToIco from 'png-to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PNG = path.join(__dirname, '../build/icon.png');
const OUTPUT_ICO = path.join(__dirname, '../build/icon.ico');
const SIZE = 1024;

async function generateLogo() {
    console.log('Generating elegant logo (S-symbol)...');

    // Create a smooth squircle path for 1024x1024
    // This is more elegant than a simple rounded rect
    const squirclePath = `
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
        <path d="M 512,0 
            C 900,0 1024,124 1024,512 
            1024,900 900,1024 512,1024 
            124,1024 0,900 0,512 
            0,124 124,0 512,0 Z" 
            fill="white" />
    </svg>`;

    // The "S" letter
    // Using a refined, bold typeface style (bold sans-serif)
    const textSvg = `
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
        <text 
            x="50%" 
            y="52%" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            font-size="620" 
            font-weight="900" 
            fill="black"
        >S</text>
    </svg>`;

    try {
        // Ensure build directory exists
        const buildDir = path.dirname(OUTPUT_PNG);
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
        }

        // Generate PNG with transparency
        const pngBuffer = await sharp({
            create: {
                width: SIZE,
                height: SIZE,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite([
            { input: Buffer.from(squirclePath), blend: 'over' },
            { input: Buffer.from(textSvg), blend: 'over' }
        ])
        .png()
        .toBuffer();

        fs.writeFileSync(OUTPUT_PNG, pngBuffer);
        console.log(`✅ Successfully generated ${OUTPUT_PNG}`);

        // Generate ICO
        console.log('Generating ICO from PNG...');
        const icoBuffer = await pngToIco(pngBuffer);
        fs.writeFileSync(OUTPUT_ICO, icoBuffer);
        console.log(`✅ Successfully generated ${OUTPUT_ICO}`);

    } catch (err) {
        console.error('❌ Failed to generate logo:', err);
    }
}

generateLogo();

