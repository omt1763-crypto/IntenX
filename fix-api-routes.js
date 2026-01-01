const fs = require('fs');
const path = require('path');

function findAllRouteFiles(dir) {
  let routeFiles = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      routeFiles = routeFiles.concat(findAllRouteFiles(fullPath));
    } else if (file.startsWith('route.') && (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.tsx'))) {
      routeFiles.push(fullPath);
    }
  }
  
  return routeFiles;
}

const apiDir = path.join(__dirname, 'app', 'api');
const routeFiles = findAllRouteFiles(apiDir);

let updated = 0;

for (const file of routeFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  const originalContent = content;
  
  // Check if file uses request.url, request.headers, request.body, etc.
  const usesRequest = /request\.(url|headers|body|method|cookies)/.test(content);
  
  if (usesRequest && !content.includes("export const dynamic")) {
    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, "\nexport const dynamic = 'force-dynamic'");
      const newContent = lines.join('\n');
      fs.writeFileSync(file, newContent, 'utf-8');
      updated++;
      console.log(`✓ Updated: ${path.relative(apiDir, file)}`);
    }
  }
}

console.log(`\nDone! Updated ${updated} API route files that use request object.`);
