const { request } = require('./client');

const id = process.argv[2];

if (!id) {
  console.error('Usage: node feature-delete.js <id>');
  process.exit(1);
}

request('DELETE', `feature/${id}`)
  .then(() => console.log(`Deleted feature: ${id}`))
  .catch(err => console.error(err.message));
