const { request } = require('./client');

const name = process.argv[2];

if (!name) {
  console.error('Usage: node project-requirement-create.js <name>');
  process.exit(1);
}

request('POST', 'project-requirement', { name })
  .then(r => console.log(`Created project requirement template: [${r.id}] ${r.name}`))
  .catch(err => console.error(err.message));
