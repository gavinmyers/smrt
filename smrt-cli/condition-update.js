const { request } = require('./client');

const id = process.argv[2];
const name = process.argv[3];
const message = process.argv[4];

if (!id || !name) {
  console.error('Usage: node condition-update.js <id> <name|-> [message|->]');
  process.exit(1);
}

const body = {};
if (name !== '-') body.name = name;
if (message && message !== '-') body.message = message;

if (Object.keys(body).length === 0) {
  console.log('No changes requested.');
  process.exit(0);
}

request('PATCH', `condition/${id}`, body)
  .then(c => console.log(`Updated condition: [${c.id}] ${c.name}`))
  .catch(err => console.error(err.message));
