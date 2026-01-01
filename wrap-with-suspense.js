const fs = require('fs');
const path = require('path');

const pagesToFix = [
  'app/recruiter/dashboard/applicants/page.tsx',
  'app/interview/realtime/page.tsx',
  'app/business/dashboard/jobs/applicants/page.tsx',
  'app/recruiter/dashboard/jobs/applicants/page.tsx'
];

for (const filePath of pagesToFix) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⊘ Skipped (not found): ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Skip if already has Suspense import
  if (content.includes("import { Suspense }") || content.includes('from "react"')) {
    // Already has Suspense or needs updating
    const hasSearchParams = content.includes('useSearchParams');
    
    if (hasSearchParams && !content.includes('function') && content.includes('export default')) {
      // Add Suspense import if missing
      if (!content.includes("import { Suspense }")) {
        content = content.replace(
          "import { useState, useEffect }",
          "import { Suspense, useState, useEffect }"
        );
      }
      
      // Find export default function and rename it
      content = content.replace(
        /export default function (\w+)\(\)/g,
        'function $1Content()'
      );
      
      // Add wrapper export at the end
      const lastClosingBrace = content.lastIndexOf('}');
      const wrapper = `\n\nexport default function ${path.basename(fullPath, '.tsx')}_Wrapper() {\n  return (\n    <Suspense fallback={<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}><p>Loading...</p></div>}>\n      <${content.match(/function (\w+)Content/)[1]}Content />\n    </Suspense>\n  )\n}`;
      
      content = content.slice(0, lastClosingBrace + 1) + wrapper + content.slice(lastClosingBrace + 1);
      
      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`✓ Fixed: ${filePath}`);
    }
  }
}

console.log('\nDone!');
