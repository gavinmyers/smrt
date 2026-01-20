const { request } = require('./client');

const featureId = process.argv[2];
const id = process.argv[3];
const name = process.argv[4];
const status = process.argv[5];

if (!featureId || !id || (!name && !status)) {
  console.error('Usage: node requirement-update.js <featureId> <id> <name|-> [status|->]');
  process.exit(1);
}

const body = {};
if (name && name !== '-') body.name = name;
if (status && status !== '-') body.status = status;

request('PATCH', `feature/${featureId}/requirement/${id}`, body)
  .then(r => console.log(`Updated requirement: [${r.id}] ${r.name} (Status: ${r.status})`))
  .catch(err => console.error(err.message));
