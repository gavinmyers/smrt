const { request } = require('./client');

const featureId = process.argv[2];

if (!featureId) {
  console.error('Usage: node requirements-list.js <featureId>');
  process.exit(1);
}

async function run() {
  try {
    const [requirements, projectRequirements] = await Promise.all([
      request('GET', `feature/${featureId}/requirements`),
      request('GET', `project-requirements`)
    ]);

    if (projectRequirements && projectRequirements.length > 0) {
      console.log(`Definition of Done (Project Templates):`);
      projectRequirements.forEach(r => {
        console.log(`- [TEMPLATE] ${r.name}`);
      });
      console.log('');
    }

    console.log(`Feature-Specific Requirements:`);
    if (!requirements || requirements.length === 0) {
      console.log('  (none)');
    } else {
      requirements.forEach(r => {
        console.log(`- [${r.id}] [${r.status}] ${r.name}`);
      });
    }
  } catch (err) {
    console.error(err.message);
  }
}

run();
