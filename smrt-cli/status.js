const { request } = require('./client');

async function main() {
  try {
    console.log('Checking SMRT Project Status...');
    const result = await request('GET', 'check');
    
    if (result.validated) {
      console.log('✅ Connection Validated');
      console.log('Project ID:', result.project.id);
      console.log('Key ID:', result.keyId);
    } else {
      console.log('❌ Validation Failed');
      console.log(result);
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

main();