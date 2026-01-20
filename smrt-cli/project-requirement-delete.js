const { request } = require('./client');

const id = process.argv[2];

if (!id) {
  console.error('Usage: node project-requirement-delete.js <id>');
  process.exit(1);
}

request('DELETE', `project-requirement/${id}`)
  .then(() => console.log(`Deleted project requirement template: ${id}`))
  .catch(err => console.error(err.message));
