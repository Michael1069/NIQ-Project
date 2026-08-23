const https = require('https');
const dotenv = require('dotenv');
dotenv.config();

const visionKey = process.env.GROQ_VISION_API_KEY;
const reasoningKey = process.env.GROQ_REASONING_API_KEY;

console.log('Testing Groq Vision Key:', visionKey ? visionKey.slice(0, 10) + '...' : 'Missing');
console.log('Testing Groq Reasoning Key:', reasoningKey ? reasoningKey.slice(0, 10) + '...' : 'Missing');

function getGroqModels(apiKey) {
  return new Promise((resolve) => {
    const req = https.request('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.data ? parsed.data.map(m => m.id) : parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', e => resolve(e.message));
    req.end();
  });
}

async function test() {
  const visionModels = await getGroqModels(visionKey);
  console.log('\n--- Available Models for Vision Key ---');
  console.log(visionModels);

  const reasoningModels = await getGroqModels(reasoningKey);
  console.log('\n--- Available Models for Reasoning Key ---');
  console.log(reasoningModels);
}

test();
