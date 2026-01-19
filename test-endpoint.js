/**
 * Test Resume Analyzer Endpoint with Detailed Logging
 * This script tests the actual /api/resume-tracker/analyze endpoint
 */

const sampleResume = `John Smith
john.smith@example.com | (555) 123-4567

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years developing web applications. 
Proficient in React, Node.js, and PostgreSQL. Strong problem-solver with 
proven track record of delivering scalable solutions.

PROFESSIONAL EXPERIENCE

Senior Software Engineer | TechCorp Inc | Jan 2022 - Present
- Led development of microservices architecture serving 1M+ daily active users
- Reduced API response time by 40% through optimization
- Mentored team of 3 junior engineers

Software Engineer | WebSoft Solutions | Jun 2019 - Dec 2021
- Developed React-based dashboard for analytics platform
- Implemented real-time data synchronization using WebSockets
- Improved test coverage from 45% to 85%

SKILLS
Languages: JavaScript, TypeScript, Python
Frameworks: React, Node.js, Express, Django
Databases: PostgreSQL, MongoDB, Redis
Tools: Git, Docker, AWS, Jenkins

EDUCATION
Bachelor of Science in Computer Science
State University | May 2019`;

const jobDescription = `Looking for a Senior Software Engineer with:
- 5+ years of experience in full-stack development
- Strong React and Node.js skills
- Experience with PostgreSQL and MongoDB
- Leadership and mentoring experience
- Microservices architecture knowledge`;

async function testAPI() {
  console.log('='.repeat(70));
  console.log('📋 TESTING RESUME ANALYZER ENDPOINT');
  console.log('='.repeat(70));
  
  // Detect which URL to use
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const endpoint = `${baseUrl}/api/resume-tracker/analyze`;
  
  console.log(`\n📍 Target Endpoint: ${endpoint}`);
  console.log(`\n📦 Test Data:`);
  console.log(`  - Resume text length: ${sampleResume.length} chars`);
  console.log(`  - Job description: ${jobDescription.length} chars`);
  console.log(`  - Phone number: test-user-123`);
  
  try {
    // Create FormData
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('resumeText', sampleResume);
    formData.append('jobDescription', jobDescription);
    formData.append('phoneNumber', 'test-user-123');
    
    console.log(`\n🚀 Sending request to ${endpoint}...`);
    console.log(`   (This may take 10-30 seconds)\n`);
    
    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders?.() || {},
    });
    
    const elapsedTime = Date.now() - startTime;
    
    console.log(`\n✅ Response received in ${elapsedTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    // Log response headers
    console.log(`\n📋 Response Headers:`);
    response.headers.forEach((value, key) => {
      if (!['transfer-encoding', 'connection'].includes(key)) {
        console.log(`   ${key}: ${value}`);
      }
    });
    
    const data = await response.json();
    
    console.log(`\n📤 Response Body:`);
    
    if (response.ok) {
      console.log(`\n✅✅✅ SUCCESS! API is working correctly!`);
      console.log(`\n📈 Analysis Results:`);
      if (data.analysis) {
        console.log(`   - Overall Score: ${data.analysis.overallScore || 'N/A'}`);
        console.log(`   - ATS Score: ${data.analysis.atsScore || 'N/A'}`);
        console.log(`   - Strengths: ${data.analysis.strengths?.slice(0, 2).join(', ') || 'N/A'}`);
        console.log(`   - Phone Number (echoed): ${data.phoneNumber || 'N/A'}`);
        console.log(`\n   Full response size: ${JSON.stringify(data).length} bytes`);
      }
    } else {
      console.log(`\n❌ API Error (Status ${response.status}):`);
      console.log(`   Error: ${data.error}`);
      console.log(`   Details: ${data.details}`);
      
      // Diagnostic hints
      console.log(`\n🔍 Diagnostic Hints:`);
      if (data.error?.includes('OpenAI')) {
        console.log('   → Problem is with OpenAI API');
        if (data.details?.includes('401')) {
          console.log('   → API key is invalid or expired');
          console.log('   → Check your OPENAI_API_KEY in Vercel environment variables');
        } else if (data.details?.includes('429')) {
          console.log('   → Rate limit exceeded - wait a moment and try again');
        } else if (data.details?.includes('quota')) {
          console.log('   → OpenAI account quota exceeded');
          console.log('   → Check your OpenAI account usage and billing');
        }
      } else if (data.error?.includes('extract')) {
        console.log('   → Problem is with PDF extraction');
      } else if (data.error?.includes('JSON')) {
        console.log('   → OpenAI response was not valid JSON');
        console.log('   → This might be a timeout or truncation issue');
      }
    }
    
    console.log(`\n📋 Full Response JSON:`);
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error(`\n❌ Network or parsing error:`);
    console.error(`   ${error.message}`);
    console.error(`\n💡 Troubleshooting:`);
    console.error(`   1. Make sure the server is running on ${baseUrl}`);
    console.error(`   2. Check if the endpoint is accessible`);
    console.error(`   3. Verify OPENAI_API_KEY is set in environment`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('Test completed');
  console.log('='.repeat(70));
}

testAPI().catch(console.error);
