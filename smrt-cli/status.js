const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const keyPath = path.join(__dirname, '..', '.smrt-cli', '.key');

try {
  if (!fs.existsSync(keyPath)) {
    console.error('Error: Configuration file not found at', keyPath);
    process.exit(1);
  }

  const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const { apiUrl, token } = keyData;

  if (!apiUrl) {
    console.error('Error: apiUrl not found in configuration.');
    process.exit(1);
  }

  console.log(`Connecting to ${apiUrl}...`);

  const url = new URL(apiUrl);
  const client = url.protocol === 'https:' ? https : http;

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = client.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log('Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();

} catch (error) {
  console.error('An error occurred:', error.message);
}
