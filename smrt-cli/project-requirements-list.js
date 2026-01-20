const { request } = require('./client');

request('GET', 'project-requirements')
  .then(requirements => {
    console.log(`Project-wide Requirements (Templates):`);
    if (!requirements || requirements.length === 0) {
      console.log('  (none)');
    } else {
      requirements.forEach(r => {
        console.log(`- [${r.id}] ${r.name}`);
      });
    }
  })
  .catch(err => console.error(err.message));
