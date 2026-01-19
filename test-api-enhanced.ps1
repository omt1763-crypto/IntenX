#!/usr/bin/env pwsh
# Test Resume Analyzer API - PowerShell Version

param(
    [string]$Endpoint = "http://localhost:3000/api/resume-tracker/analyze",
    [string]$ApiKey = $env:OPENAI_API_KEY
)

Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host " 📋 RESUME ANALYZER API TEST" -ForegroundColor Cyan
Write-Host "═" * 70

# Check environment
Write-Host "`n🔍 Environment Check:" -ForegroundColor Yellow
Write-Host "  OPENAI_API_KEY set: $(if ($ApiKey) { '✅ YES' } else { '❌ NO' })"
if ($ApiKey) {
    Write-Host "  Key length: $($ApiKey.Length)"
    Write-Host "  Key prefix: $($ApiKey.Substring(0, 10))..."
}
Write-Host "  Test endpoint: $Endpoint"

# Sample resume data
$sampleResume = @"
John Smith
john.smith@example.com | (555) 123-4567

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years developing web applications.

PROFESSIONAL EXPERIENCE
Senior Software Engineer | TechCorp Inc | Jan 2022 - Present
- Led development of microservices architecture
- Reduced API response time by 40%
- Mentored team of 3 junior engineers

SKILLS
Languages: JavaScript, TypeScript, Python
Frameworks: React, Node.js, Express
Databases: PostgreSQL, MongoDB

EDUCATION
Bachelor of Science in Computer Science | State University | May 2019
"@

$jobDescription = @"
Looking for a Senior Software Engineer with:
- 5+ years of experience in full-stack development
- Strong React and Node.js skills
- Leadership and mentoring experience
"@

Write-Host "`n📦 Test Data:" -ForegroundColor Yellow
Write-Host "  Resume text length: $($sampleResume.Length) chars"
Write-Host "  Job description length: $($jobDescription.Length) chars"
Write-Host "  Phone number: test-user-123"

Write-Host "`n🚀 Sending request..." -ForegroundColor Cyan
Write-Host "  (This may take 10-30 seconds)`n"

try {
    # Create form data
    $formData = @{
        resumeText = $sampleResume
        jobDescription = $jobDescription
        phoneNumber = "test-user-123"
    }
    
    # Convert to multipart form data
    $body = @()
    foreach ($key in $formData.Keys) {
        $value = $formData[$key]
        $body += "--boundary"
        $body += "Content-Disposition: form-data; name=`"$key`""
        $body += ""
        $body += $value
    }
    $body += "--boundary--"
    $bodyString = $body -join "`r`n"
    
    $startTime = Get-Date
    
    $response = Invoke-WebRequest -Uri $Endpoint `
        -Method POST `
        -ContentType "multipart/form-data; boundary=boundary" `
        -Body $bodyString `
        -ErrorAction Stop
    
    $elapsedMs = ((Get-Date) - $startTime).TotalMilliseconds
    
    Write-Host "✅ Response received in $([int]$elapsedMs)ms`n" -ForegroundColor Green
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅✅✅ SUCCESS! API is working correctly!`n" -ForegroundColor Green
        
        if ($data.analysis) {
            Write-Host "📈 Analysis Results:" -ForegroundColor Yellow
            Write-Host "  Overall Score: $($data.analysis.overallScore)"
            Write-Host "  ATS Score: $($data.analysis.atsScore)"
            if ($data.analysis.strengths) {
                Write-Host "  Strengths: $($data.analysis.strengths[0..1] -join ', ')"
            }
            Write-Host "  Phone Number: $($data.phoneNumber)"
            Write-Host "`n  Response size: $(($data | ConvertTo-Json).Length) bytes"
        }
    } else {
        Write-Host "❌ API Error (Status $($response.StatusCode)):" -ForegroundColor Red
        Write-Host "  Error: $($data.error)"
        Write-Host "  Details: $($data.details)"
    }
    
    Write-Host "`n📋 Full Response:" -ForegroundColor Yellow
    Write-Host ($data | ConvertTo-Json -Depth 10)
    
} catch [System.Net.Http.HttpRequestException] {
    Write-Host "❌ Network Error:" -ForegroundColor Red
    Write-Host "  $_"
    Write-Host "`n💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure the server is running on $Endpoint"
    Write-Host "  2. Check if the endpoint is accessible"
    Write-Host "  3. Verify OPENAI_API_KEY is set in your Vercel environment"
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host "  $_"
}

Write-Host "`n" + ("═" * 70) -ForegroundColor Cyan
Write-Host " Test completed" -ForegroundColor Cyan
Write-Host ("═" * 70) -ForegroundColor Cyan
