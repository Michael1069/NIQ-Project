const https = require('https');
const dotenv = require('dotenv');
dotenv.config();

const reasoningKey = process.env.GROQ_REASONING_API_KEY;

const payload = {
  model: 'groq/compound',
  messages: [
    { role: 'user', content: 'Output JSON: {"status": "ok", "message": "Groq Compound API working"}' }
  ]
};

const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${reasoningKey}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.write(JSON.stringify(payload));
req.end();
