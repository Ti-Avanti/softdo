import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(__dirname, '../build');
const ICON_PNG = path.join(BUILD_DIR, 'icon.png');
const ICON_ICO = path.join(BUILD_DIR, 'icon.ico');

async function generateIco() {
    console.log(`Converting ${ICON_PNG} to ICO...`);
    try {
        if (!fs.existsSync(ICON_PNG)) {
            console.error('Error: icon.png not found in build directory.');
            process.exit(1);
        }

        const buf = await pngToIco(ICON_PNG);
        fs.writeFileSync(ICON_ICO, buf);
        console.log(`✅ Successfully generated ${ICON_ICO}`);
    } catch (e) {
        console.error('❌ Failed to convert icon:', e);
        process.exit(1);
    }
}

generateIco();
