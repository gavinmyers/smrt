const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const keyPath = path.join(__dirname, '..', '.smrt-cli', '.key');

function getConfig() {
  if (!fs.existsSync(keyPath)) {
    console.error('Error: Configuration file not found at', keyPath);
    process.exit(1);
  }
  try {
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    if (!keyData.apiUrl || !keyData.projectId || !keyData.id || !keyData.token) {
      console.error('Error: Incomplete configuration in .key file.');
      process.exit(1);
    }
    return keyData;
  } catch (e) {
    console.error('Error parsing configuration file:', e.message);
    process.exit(1);
  }
}

function request(method, endpoint, body = null) {
  const config = getConfig();
  const baseUrl = config.apiUrl.replace(/\/$/, '');
  const apiPath = `/api/cli/${config.projectId}/${config.id}${endpoint ? '/' + endpoint : ''}`;
  const fullUrl = new URL(apiPath, baseUrl);

  const client = fullUrl.protocol === 'https:' ? https : http;

  const options = {
    hostname: fullUrl.hostname,
    port: fullUrl.port || (fullUrl.protocol === 'https:' ? 443 : 80),
    path: fullUrl.pathname + fullUrl.search,
    method: method,
    headers: {
      'x-cli-secret': config.token,
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
