const { request } = require('./client');

const id = process.argv[2]; // ignored if using config
const name = process.argv[3];
const description = process.argv[4];

// In client.js, we use config.projectId, so we don't strictly need id here if we want to update the current project.
// Let's make it: node project-update.js <name|-> <description|->

const arg1 = process.argv[2];
const arg2 = process.argv[3];

if (!arg1) {
  console.error('Usage: node project-update.js <name|-> [description|->]');
  process.exit(1);
}

const body = {};
if (arg1 !== '-') body.name = arg1;
if (arg2 && arg2 !== '-') body.description = arg2;

if (Object.keys(body).length === 0) {
  console.log('No changes requested.');
  process.exit(0);
}

request('PATCH', '', body)
  .then(p => console.log(`Updated project: ${p.name}\nDescription: ${p.description}`))
  .catch(err => console.error(err.message));
