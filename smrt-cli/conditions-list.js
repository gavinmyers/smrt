const { request } = require('./client');

request('GET', 'conditions')
  .then(conditions => {
    console.log('Conditions:');
    if (!conditions || conditions.length === 0) {
      console.log('  (none)');
    } else {
      conditions.forEach(c => {
        console.log(`- [${c.id}] ${c.name} (${c.message || 'no message'})`);
      });
    }
  })
  .catch(err => console.error(err.message));
