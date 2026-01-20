const { request } = require('./client');

const featureId = process.argv[2];
const name = process.argv[3];

if (!featureId || !name) {
  console.error('Usage: node requirement-create.js <featureId> <name>');
  process.exit(1);
}

request('POST', `feature/${featureId}/requirement`, { name })
  .then(r => console.log(`Created requirement: [${r.id}] ${r.name}`))
  .catch(err => console.error(err.message));
