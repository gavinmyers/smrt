const { request } = require('./client');

const featureId = process.argv[2];
const id = process.argv[3];

if (!featureId || !id) {
  console.error('Usage: node requirement-complete.js <featureId> <id>');
  process.exit(1);
}

request('PATCH', `feature/${featureId}/requirement/${id}`, { status: 'CLOSED' })
  .then(r => console.log(`Completed requirement: [${r.id}] ${r.name}`))
  .catch(err => console.error(err.message));
