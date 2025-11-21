import sharp from 'sharp';
import icongen from 'icon-gen';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ICON = path.join(__dirname, 'source_icon.png');
const TARGET_DIR = path.join(__dirname, '../src-tauri/png');
const APP_NAME = 'messenger';

async function generateIcons() {
  console.log('Generating icons...');

  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`Source icon not found at ${SOURCE_ICON}`);
    process.exit(1);
  }

  // 1. Generate messenger_512.png
  const png512Path = path.join(TARGET_DIR, `${APP_NAME}_512.png`);
  await sharp(SOURCE_ICON)
    .resize(512, 512)
    .png()
    .toFile(png512Path);
  console.log(`Generated ${png512Path}`);

  // 2. Generate ICOs
  // We'll generate a temporary ICO and then copy it
  const tempDir = path.join(__dirname, 'temp_icons');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  try {
    const options = {
      report: true,
      ico: {
        name: 'icon',
        sizes: [32, 256] // Generate specific sizes if possible, or standard
      }
    };

    // icon-gen generates files in the dest dir
    await icongen(SOURCE_ICON, tempDir, options);
    
    // icon-gen usually creates 'icon.ico'
    const generatedIco = path.join(tempDir, 'icon.ico');
    
    if (fs.existsSync(generatedIco)) {
        // Copy to messenger_256.ico and messenger_32.ico
        // Note: Ideally we'd have specific ICOs but a multi-size ICO often works for both or we can just copy the same one
        // if they are expected to be different sizes strictly, we might need to be careful, but usually Windows ICOs hold multiple sizes.
        // However, the file names suggest separation. Let's see if we can generate separate ones or just use the same one.
        // For safety, let's just use the same multi-size ICO for both, as it contains both 32 and 256.
        
        fs.copyFileSync(generatedIco, path.join(TARGET_DIR, `${APP_NAME}_256.ico`));
        console.log(`Generated ${APP_NAME}_256.ico`);
        
        fs.copyFileSync(generatedIco, path.join(TARGET_DIR, `${APP_NAME}_32.ico`));
        console.log(`Generated ${APP_NAME}_32.ico`);
    } else {
        console.error('Failed to generate ICO file');
    }

  } catch (err) {
    console.error('Error generating ICO:', err);
  } finally {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

generateIcons();
