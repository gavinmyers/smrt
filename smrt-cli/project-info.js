const { request } = require('./client');

request('GET', '')
  .then(p => {
    console.log(`Project: ${p.name}`);
    console.log(`ID: ${p.id}`);
    console.log(`Description: ${p.description || '(none)'}`);
    console.log(`Created: ${p.createdAt}`);
  })
  .catch(err => console.error(err.message));
