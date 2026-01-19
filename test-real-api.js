#!/usr/bin/env node

// Test Resume Analyzer API with Fake Resume

const https = require('https');
const http = require('http');

const apiKey = process.env.OPENAI_API_KEY;
const endpoint = process.argv[2] || 'http://localhost:3000/api/resume-tracker/analyze';

console.log('\n' + '='.repeat(70));
console.log('TESTING RESUME ANALYZER API WITH FAKE RESUME');
console.log('='.repeat(70) + '\n');

if (!apiKey) {
  console.error('ERROR: OPENAI_API_KEY environment variable not set!');
  console.error('\nUsage:');
  console.error('  $env:OPENAI_API_KEY = "sk-proj-your-key"');
  console.error('  node test-real-api.js\n');
  process.exit(1);
}

// Fake resume
const sampleResume = `JOHN DOE
john.doe@email.com | (555) 123-4567

PROFESSIONAL SUMMARY
Experienced full-stack software engineer with 6+ years of expertise in designing and implementing scalable web applications. Proficient in React, Node.js, TypeScript, and cloud technologies. Strong track record of delivering high-quality solutions and mentoring junior developers.

PROFESSIONAL EXPERIENCE

Senior Software Engineer | TechCorp Solutions | Jan 2022 - Present
- Led architecture design for microservices platform handling 10M+ daily requests
- Reduced API response time by 45% through optimization and caching strategies
- Mentored team of 5 junior engineers on best practices and code quality
- Implemented CI/CD pipeline using GitHub Actions, reducing deployment time by 60%
- Technologies: TypeScript, React, Node.js, PostgreSQL, Docker, AWS

Full Stack Developer | WebInnovate Inc | Jun 2020 - Dec 2021
- Developed React-based dashboard for real-time data analytics and visualization
- Built RESTful APIs using Node.js and Express handling 500K+ requests daily
- Implemented real-time WebSocket communication for live data updates
- Improved application performance resulting in 40% faster load times
- Technologies: JavaScript, React, Node.js, MongoDB, AWS

Junior Developer | StartupLabs | Jan 2019 - May 2020
- Contributed to full-stack development of customer management platform
- Implemented responsive UI components using React and CSS
- Worked with REST APIs and database optimization
- Participated in code reviews and agile development processes

SKILLS
Languages: JavaScript, TypeScript, Python, SQL, HTML5, CSS3
Frontend: React, Redux, Vue.js, Bootstrap, Material-UI
Backend: Node.js, Express, Django
Databases: PostgreSQL, MongoDB, Redis
Cloud: AWS, Google Cloud Platform, Docker, Kubernetes
Tools: Git, GitHub, Jira, Figma

EDUCATION
Bachelor of Science in Computer Science
State University | May 2019`;

const jobDescription = `Senior Full Stack Engineer

Requirements:
- 5+ years of software development experience
- Strong proficiency in React and Node.js
- Experience with TypeScript and modern JavaScript
- Database design and optimization skills
- Cloud platform experience (AWS/GCP)
- Microservices architecture knowledge
- Leadership and mentoring experience

Nice to Have:
- Open source contributions
- Speaking experience
- DevOps knowledge`;

console.log('Sample Data:');
console.log(`  Resume length: ${sampleResume.length} characters`);
console.log(`  Job description length: ${jobDescription.length} characters`);
console.log(`  Endpoint: ${endpoint}`);
console.log(`  API Key: ${apiKey.substring(0, 20)}...\n`);

console.log('Sending request to API...\n');

const startTime = Date.now();

// Build form data
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const form = new FormData();
form.append('resumeText', sampleResume);
form.append('jobDescription', jobDescription);
form.append('phoneNumber', 'test-555-1234');

// Determine if http or https
const isHttps = endpoint.startsWith('https');
const client = isHttps ? https : http;

const urlObj = new URL(endpoint);
const options = {
  hostname: urlObj.hostname,
  port: urlObj.port || (isHttps ? 443 : 80),
  path: urlObj.pathname + urlObj.search,
  method: 'POST',
  headers: form.getHeaders(),
};

if (isHttps && urlObj.port === undefined) {
  options.port = 443;
}

const request = client.request(options, (response) => {
  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Response received in ${elapsed} seconds\n`);
    console.log(`Status: ${response.statusCode}\n`);

    try {
      const json = JSON.parse(data);

      if (response.statusCode === 200 && json.success) {
        console.log('═'.repeat(70));
        console.log('ANALYSIS RESULTS');
        console.log('═'.repeat(70));
        console.log('');

        if (json.analysis) {
          const a = json.analysis;
          
          console.log('📊 OVERALL SCORES:');
          console.log(`  Overall Score:        ${a.overallScore}/100`);
          console.log(`  ATS Score:            ${a.atsScore}/100`);
          console.log(`  Readability Score:    ${a.readabilityScore}/100`);
          console.log(`  Keyword Match Score:  ${a.keywordMatchScore}/100`);
          console.log(`  Role Fit Score:       ${a.roleFitScore}/100`);
          console.log('');

          if (a.strengths && a.strengths.length > 0) {
            console.log('💪 STRENGTHS:');
            a.strengths.slice(0, 3).forEach((s) => {
              console.log(`  • ${s}`);
            });
            console.log('');
          }

          if (a.weaknesses && a.weaknesses.length > 0) {
            console.log('⚠️  WEAKNESSES:');
            a.weaknesses.slice(0, 3).forEach((w) => {
              console.log(`  • ${w}`);
            });
            console.log('');
          }

          if (a.jdComparison) {
            console.log('📋 JOB DESCRIPTION MATCH:');
            console.log(`  Role Alignment: ${a.jdComparison.roleAlignment}%`);
            console.log(`  Match Percentage: ${a.jdComparison.matchPercentage}%`);
            console.log('');
          }

          if (a.actionableTips && a.actionableTips.length > 0) {
            console.log('💡 ACTIONABLE TIPS:');
            a.actionableTips.slice(0, 3).forEach((tip, i) => {
              console.log(`  ${i + 1}. ${tip}`);
            });
            console.log('');
          }
        }

        console.log('═'.repeat(70));
        console.log('✅✅✅ API IS WORKING CORRECTLY! ✅✅✅');
        console.log('═'.repeat(70));
      } else {
        console.log('❌ API ERROR:');
        console.log(`  Error: ${json.error}`);
        console.log(`  Details: ${json.details}`);
        console.log('');
        console.log('Full response:');
        console.log(JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.error('❌ Failed to parse response:');
      console.error(e.message);
      console.error('\nRaw response:');
      console.error(data);
    }

    console.log('');
  });
});

request.on('error', (error) => {
  console.error('❌ Network Error:');
  console.error(`  ${error.message}`);
  console.error('');
  console.error('This usually means:');
  console.error('  1. Server is not running');
  console.error('  2. Endpoint URL is incorrect');
  console.error('  3. Network connectivity issue\n');
});

form.pipe(request);
