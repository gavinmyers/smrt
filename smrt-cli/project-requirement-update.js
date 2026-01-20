const { request } = require('./client');

const id = process.argv[2];
const name = process.argv[3];

if (!id || !name) {
  console.error('Usage: node project-requirement-update.js <id> <name>');
  process.exit(1);
}

request('PATCH', `project-requirement/${id}`, { name })
  .then(r => console.log(`Updated project requirement template: [${r.id}] ${r.name}`))
  .catch(err => console.error(err.message));
