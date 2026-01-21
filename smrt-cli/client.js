const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const keyPathDefault = path.join(__dirname, '..', '.smrt-cli', '.key');

// Check for and remove custom key path in arguments: --key=path or -key=path
// We do this at the top level so scripts that read process.argv directly see the clean version
let customPath = null;
const keyArgIndex = process.argv.findIndex(arg => arg.startsWith('--key=') || arg.startsWith('-key='));

if (keyArgIndex !== -1) {
  customPath = process.argv[keyArgIndex].split('=')[1];
  process.argv.splice(keyArgIndex, 1);
}

function getConfig() {
  const finalKeyPath = customPath ? path.resolve(process.cwd(), customPath) : keyPathDefault;

  if (!fs.existsSync(finalKeyPath)) {
    console.error('Error: Configuration file not found at', finalKeyPath);
    process.exit(1);
  }
  try {
    const keyData = JSON.parse(fs.readFileSync(finalKeyPath, 'utf8'));
    // Support both old 'id' and new 'keyId'
    const id = keyData.keyId || keyData.id;
    if (!keyData.apiUrl || !keyData.projectId || !id || !keyData.secret) {
      console.error('Error: Incomplete configuration in key file.');
      process.exit(1);
    }
    return { ...keyData, id };
  } catch (e) {
    console.error('Error parsing configuration file:', e.message);
    process.exit(1);
  }
}

function request(method, endpoint, body = null) {
  const config = getConfig();
  
  // Use environment CLI_URL override if present, otherwise use the full apiUrl from config
  const rawBaseUrl = process.env.CLI_URL || config.apiUrl;
  const baseUrl = new URL(rawBaseUrl).origin;

  // The config's apiUrl is the base path if it's a path, or the full path if it's a URL
  const apiBasePath = config.apiUrl.startsWith('http') 
    ? new URL(config.apiUrl).pathname 
    : config.apiUrl;

  const apiPath = `${apiBasePath.replace(/\/$/, '')}${endpoint ? '/' + endpoint : ''}`;
  const fullUrl = new URL(apiPath, baseUrl);

  const client = fullUrl.protocol === 'https:' ? https : http;

  const options = {
    hostname: fullUrl.hostname,
    port: fullUrl.port || (fullUrl.protocol === 'https:' ? 443 : 80),
    path: fullUrl.pathname + fullUrl.search,
    method: method,
    headers: {
      'x-cli-secret': config.secret,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    }
  };

  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (!data) return resolve(null);
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          const errMsg = data ? `\nResponse: ${data}` : '';
          reject(new Error(`Request failed with status ${res.statusCode}${errMsg}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Network error: ${e.message}`)));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

module.exports = { request };
