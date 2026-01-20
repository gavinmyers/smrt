const { request } = require('./client');

const id = process.argv[2];

if (!id) {
  console.error('Usage: node feature-complete.js <id>');
  process.exit(1);
}

request('PATCH', `feature/${id}`, { status: 'CLOSED' })
  .then(f => console.log(`Completed feature: [${f.id}] ${f.name}`))
  .catch(err => console.error(err.message));
