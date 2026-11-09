const fs = require('fs');
const path = require('path');

// Read environment variables
const controlHost = process.env.CONTROL_HOST || '';
const apiHost = process.env.VITE_API_HOST || process.env.CONTROL_HOST || '';

// Determine replacement values
const controlHostVal = controlHost ? `"${controlHost}"` : '(typeof window!=="undefined"?window.location.hostname:"localhost")';
const apiHostVal = apiHost ? `"${apiHost}"` : '(typeof window!=="undefined"?window.location.hostname:"localhost")';

// Find the index-*.js file
const assetsDir = path.join(__dirname, 'dist', 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  if (jsFile) {
    const filePath = path.join(assetsDir, jsFile);
    let content = fs.readFileSync(filePath, 'utf8');

    // Regex to match the minified environment variables object (any variable name e.g. cf, xf)
    const match = content.match(/([a-zA-Z0-9_$]+)\s*=\s*\{\s*BASE_URL\s*:\s*"\/",\s*DEV\s*:\s*!1,\s*MODE\s*:\s*"production",\s*PROD\s*:\s*!0,\s*SSR\s*:\s*!1\s*\}/);
    if (match) {
      const varName = match[1];
      const replacement = `${varName}={BASE_URL:"/",DEV:!1,MODE:"production",PROD:!0,SSR:!1,VITE_API_HOST:${apiHostVal},VITE_CONTROL_HOST:${controlHostVal}}`;
      content = content.replace(match[0], replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully patched ${jsFile} at runtime with CONTROL_HOST=${controlHost} and VITE_API_HOST=${apiHost}`);
    } else {
      console.warn(`Warning: Target env pattern not found in ${jsFile}.`);
    }
  } else {
    console.error('Error: Could not find index-*.js file.');
  }
} else {
  console.error('Error: dist/assets directory not found.');
}
