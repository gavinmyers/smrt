const { request } = require('./client');

const name = process.argv[2];
const message = process.argv[3];

if (!name) {
  console.error('Usage: node feature-create.js <name> [message]');
  process.exit(1);
}

request('POST', 'feature', { name, message })
  .then(f => console.log(`Created feature: [${f.id}] ${f.name}`))
  .catch(err => console.error(err.message));
