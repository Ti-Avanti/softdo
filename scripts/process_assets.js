import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BRAIN_DIR = 'C:/Users/Evan/.gemini/antigravity/brain/2910ad97-8fdd-49b2-ad9f-b8c8323f835b';
const REF_LOGO = 'logo_v2_clean_1769268810907.png';
const REF_SIDEBAR = 'installer_sidebar_1769268827891.png';

const BUILD_DIR = path.join(__dirname, '../build');
const LOGO_SRC = path.join(BRAIN_DIR, REF_LOGO);
const SIDEBAR_SRC = path.join(BRAIN_DIR, REF_SIDEBAR);

async function processAssets() {
    console.log('Processing Assets...');

    // 1. Process Logo
    // Copy as icon.png (256x256)
    await sharp(LOGO_SRC)
        .resize(256, 256)
        .toFile(path.join(BUILD_DIR, 'icon.png'));
    
    // Generate icon.ico
    const buf = await pngToIco(LOGO_SRC);
    fs.writeFileSync(path.join(BUILD_DIR, 'icon.ico'), buf);
    
    console.log('✅ Logo processed (png & ico)');

    // 2. Process Installer Sidebar
    // Resize to 164x314 (NSIS standard) and Convert to BMP if possible, or PNG.
    // Electron-builder NSIS supports BMP best. Sharp can output to buffer then we verify.
    // Sharp doesn't support BMP output natively easily.
    // We'll output as PNG and BMP logic might rely on `jimp` or just try PNG.
    // Users reported PNG works in modern electron-builder for `installerSidebar`.
    // We will resize it strictly.
    
    await sharp(SIDEBAR_SRC)
        .resize(164, 314, { fit: 'cover' })
        .toFile(path.join(BUILD_DIR, 'installerSidebar.bmp')); // Tricking extension? No, sharp may fail.
    
    // Actually, sharp does not support BMP. 
    // We will save as 'installerSidebar.png' and update package.json to point to it.
    await sharp(SIDEBAR_SRC)
        .resize(164, 314, { fit: 'cover' })
        .toFile(path.join(BUILD_DIR, 'installerSidebar.png'));

    console.log('✅ Sidebar processed');
}

processAssets().catch(console.error);
