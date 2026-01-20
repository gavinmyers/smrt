const { request } = require('./client');

const name = process.argv[2];
const message = process.argv[3];

if (!name) {
  console.error('Usage: node condition-create.js <name> [message]');
  process.exit(1);
}

request('POST', 'condition', { name, message })
  .then(c => console.log(`Created condition: [${c.id}] ${c.name}`))
  .catch(err => console.error(err.message));
