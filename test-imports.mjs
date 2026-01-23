// Test if imports work correctly
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing @spayce/react-ui imports...\n');

try {
    const reactUiPath = resolve(__dirname, 'packages/react-ui/src/index.ts');
    console.log('React UI path:', reactUiPath);

    // Note: This will fail because it's TypeScript, but we can check the file exists
    const fs = await import('fs');
    const content = fs.readFileSync(reactUiPath, 'utf-8');

    console.log('✓ react-ui/src/index.ts exists');
    console.log('Exports found:');

    const exportLines = content.split('\n').filter(line => line.trim().startsWith('export'));
    exportLines.slice(0, 20).forEach(line => console.log('  ', line.trim()));

} catch (error) {
    console.error('✗ Error:', error.message);
}
