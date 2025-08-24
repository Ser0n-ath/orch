import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing BatonCore API...\n');

  // Test health endpoint
  console.log('1. Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return;
  }

  // Test automation endpoint with different prompts
  const testPrompts = [
    "Go to Google and search for TypeScript",
    "Visit Wikipedia and find a random article",
    "Go to Hacker News and get the top story"
  ];

  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    console.log(`\n${i + 2}. Testing automation: "${prompt}"`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (data.success) {
        console.log(`✅ Success (${duration}ms)`);
        console.log(`📋 Plan: ${data.result.plan.length} steps`);
        console.log(`📊 Outputs: ${data.result.outputs.length} results`);
        console.log(`📸 Screenshots: ${data.result.screenshots.length} files`);
        
        // Show first few plan steps
        console.log('🎯 Plan preview:');
        data.result.plan.slice(0, 3).forEach((step: any, idx: number) => {
          console.log(`   ${idx + 1}. ${step.name.toUpperCase()}: "${step.query}"`);
        });
        if (data.result.plan.length > 3) {
          console.log(`   ... and ${data.result.plan.length - 3} more steps`);
        }
      } else {
        console.log('❌ Failed:', data.error);
      }
    } catch (error) {
      console.error('❌ Request failed:', error);
    }
  }

  console.log('\n🎉 API testing completed!');
}

// Run the test
testAPI().catch(console.error);
