const { request } = require('./client');

const id = process.argv[2];

if (!id) {
  console.error('Usage: node condition-delete.js <id>');
  process.exit(1);
}

request('DELETE', `condition/${id}`)
  .then(() => console.log(`Deleted condition: ${id}`))
  .catch(err => console.error(err.message));
