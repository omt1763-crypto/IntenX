$body = @{
    resumeText = 'John Smith is a software engineer with 5 years of experience in React and Node.js. Strong problem-solver with proven track record developing scalable web applications.'
    jobDescription = 'Looking for senior software engineer with React and Node.js experience'
    phoneNumber = '+919876543210'
} | ConvertTo-Json

Write-Host "Testing Resume Analyzer API"
Write-Host "Body size: $($body.Length) bytes"

try {
    $response = Invoke-WebRequest -Uri 'https://www.aiinterviewx.com/api/resume-tracker/analyze' `
        -Method POST `
        -Body $body `
        -ContentType 'application/json' `
        -UseBasicParsing `
        -TimeoutSec 30

    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    Write-Host "Response:"
    $_.Exception.Response.Content | Write-Host
}
