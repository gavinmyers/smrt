const { request } = require('./client');

const id = process.argv[2];
const name = process.argv[3];
const message = process.argv[4];
const status = process.argv[5];

if (!id || (!name && !message && !status)) {
  console.error('Usage: node feature-update.js <id> <name|-> [message|->] [status|->]');
  process.exit(1);
}

const body = {};
if (name && name !== '-') body.name = name;
if (message && message !== '-') body.message = message;
if (status && status !== '-') body.status = status;

if (Object.keys(body).length === 0) {
  console.log('No changes requested.');
  process.exit(0);
}

request('PATCH', `feature/${id}`, body)
  .then(f => console.log(`Updated feature: [${f.id}] ${f.name} (Status: ${f.status})`))
  .catch(err => console.error(err.message));
