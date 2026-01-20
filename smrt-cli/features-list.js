const { request } = require('./client');

request('GET', 'features')
  .then(features => {
    console.log('Features:');
    if (!features || features.length === 0) {
      console.log('  (none)');
    } else {
      features.forEach(f => {
        console.log(`- [${f.id}] [${f.status}] ${f.name} (${f.message || 'no message'})`);
      });
    }
  })
  .catch(err => console.error(err.message));
