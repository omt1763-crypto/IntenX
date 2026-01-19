#!/usr/bin/env node

/**
 * Direct OpenAI Test - Tests if OpenAI API is accessible
 */

const https = require('https');

// Check if API key is set
const apiKey = process.env.OPENAI_API_KEY;
console.log('='.repeat(60));
console.log('🔍 OPENAI API KEY CHECK');
console.log('='.repeat(60));
console.log('OPENAI_API_KEY is set:', !!apiKey);
if (apiKey) {
  console.log('Key length:', apiKey.length);
  console.log('Key prefix:', apiKey.substring(0, 10) + '...');
  console.log('Starts with sk-proj:', apiKey.startsWith('sk-proj-'));
} else {
  console.log('❌ ERROR: OPENAI_API_KEY is NOT set in environment variables!');
  console.log('Please set it and try again:');
  console.log('  Windows PowerShell: $env:OPENAI_API_KEY = "your-key-here"');
  console.log('  Windows CMD: set OPENAI_API_KEY=your-key-here');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('📤 TESTING OPENAI API CALL');
console.log('='.repeat(60));

async function testOpenAI() {
  const sampleResume = `John Smith
john.smith@example.com | (555) 123-4567

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years developing web applications.

PROFESSIONAL EXPERIENCE
Senior Software Engineer | TechCorp Inc | Jan 2022 - Present
- Led development of microservices
- Reduced API response time by 40%
- Mentored team of 3 junior engineers

SKILLS
Languages: JavaScript, TypeScript, Python
Frameworks: React, Node.js, Express
Databases: PostgreSQL, MongoDB

EDUCATION
Bachelor of Science in Computer Science | State University | May 2019`;

  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a resume analyst. Respond with a simple JSON object with keys: strengths, score'
      },
      {
        role: 'user',
        content: `Analyze this resume briefly:\n\n${sampleResume}`
      }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  };

  return new Promise((resolve, reject) => {
    console.log('\nRequest Details:');
    console.log('- Hostname:', options.hostname);
    console.log('- Path:', options.path);
    console.log('- Method:', options.method);
    console.log('- Auth Header: Bearer', apiKey.substring(0, 15) + '...');
    console.log('- Payload size:', payload.length, 'bytes');
    console.log('\nSending request...\n');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Headers:');
        Object.entries(res.headers).forEach(([key, value]) => {
          if (!['transfer-encoding', 'connection'].includes(key)) {
            console.log(`  ${key}: ${value}`);
          }
        });
        console.log('\nResponse Body:');
        
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
          
          if (res.statusCode === 200) {
            console.log('\n✅ SUCCESS! OpenAI is responding correctly');
            const content = parsed.choices?.[0]?.message?.content;
            if (content) {
              console.log('\nAnalysis content received:');
              console.log(content.substring(0, 200) + '...');
            }
          } else {
            console.log('\n❌ ERROR from OpenAI:');
            if (parsed.error) {
              console.log('Error type:', parsed.error.type);
              console.log('Error message:', parsed.error.message);
            }
          }
        } catch (e) {
          console.log(data);
          console.log('\n❌ ERROR: Could not parse response as JSON');
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Network Error:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('❌ Timeout: Request took too long');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(30000);
    req.write(payload);
    req.end();
  });
}

testOpenAI()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('Test completed');
    console.log('='.repeat(60));
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
