import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const distDir = 'dist';
const dmg = fs.readdirSync(distDir).find((f) => f.endsWith('.dmg'));

if (!dmg) {
  console.error('❌ No DMG found in dist/');
  process.exit(1);
}

const dmgPath = path.join(distDir, dmg);

console.log(`🔐 Notarizing ${dmgPath}`);

execSync(
  `xcrun notarytool submit \
    --key ${process.env.APPLE_NOTARIZATION_KEY} \
    --key-id ${process.env.APPLE_NOTARIZATION_KEY_ID} \
    --issuer ${process.env.APPLE_NOTARIZATION_ISSUER_ID} \
    --wait \
    "${dmgPath}"`,
  { stdio: 'inherit' }
);

console.log('📎 Stapling notarization ticket');

execSync(`xcrun stapler staple "${dmgPath}"`, { stdio: 'inherit' });

console.log('✅ Notarization complete');
