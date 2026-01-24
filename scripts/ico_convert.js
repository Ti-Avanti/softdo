import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(__dirname, '../build');

async function convert() {
    console.log('Converting icon.png to icon.ico...');
    try {
        const buf = await pngToIco(path.join(BUILD_DIR, 'icon.png'));
        fs.writeFileSync(path.join(BUILD_DIR, 'icon.ico'), buf);
        console.log('✅ Done.');
    } catch (e) {
        console.error('Failed:', e);
    }
}

convert();
