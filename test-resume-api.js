// Test the resume analyzer API
const testData = {
  resumeText: `
John Smith
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
State University | May 2019
  `,
  jobDescription: `
Looking for a Senior Software Engineer with:
- 5+ years of experience in full-stack development
- Strong React and Node.js skills
- Experience with PostgreSQL and MongoDB
- Leadership and mentoring experience
- Microservices architecture knowledge
  `,
  phoneNumber: '+919876543210'
}

async function testAnalyzeAPI() {
  try {
    console.log('Testing resume analyzer API...')
    console.log('Endpoint: https://www.aiinterviewx.com/api/resume-tracker/analyze')
    console.log('Payload size:', JSON.stringify(testData).length, 'bytes')
    
    const formData = new FormData()
    formData.append('resumeText', testData.resumeText)
    formData.append('jobDescription', testData.jobDescription)
    formData.append('phoneNumber', testData.phoneNumber)
    
    const response = await fetch('https://www.aiinterviewx.com/api/resume-tracker/analyze', {
      method: 'POST',
      body: formData
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers))
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ SUCCESS! Analysis received:')
      console.log('Overall Score:', data.analysis?.overallScore)
      console.log('ATS Score:', data.analysis?.atsScore)
      console.log('Strengths:', data.analysis?.strengths?.slice(0, 2))
      console.log('Full response:', JSON.stringify(data, null, 2))
    } else {
      console.error('❌ API Error:')
      console.error('Error:', data.error)
      console.error('Details:', data.details)
      console.error('Full response:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

// Run test
testAnalyzeAPI()
