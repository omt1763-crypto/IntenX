const fs = require('fs');
const path = require('path');

function findRouteFiles(dir) {
  let routeFiles = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      routeFiles = routeFiles.concat(findRouteFiles(fullPath));
    } else if (file.startsWith('route.') && (file.endsWith('.js') || file.endsWith('.ts'))) {
      routeFiles.push(fullPath);
    }
  }
  
  return routeFiles;
}

const apiDir = path.join(__dirname, 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

let fixed = 0;

for (const file of routeFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  const originalContent = content;
  
  // Remove duplicate dynamic exports
  const lines = content.split('\n');
  const newLines = [];
  let dynamicAdded = false;
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = newLines.length;
    }
    // Skip duplicate dynamic exports
    if (!lines[i].includes("export const dynamic")) {
      newLines.push(lines[i]);
    }
  }
  
  // Add dynamic export after last import if not already present
  if (lastImportIndex >= 0 && !originalContent.includes("export const dynamic")) {
    newLines.splice(lastImportIndex + 1, 0, "export const dynamic = 'force-dynamic'");
  }
  
  const newContent = newLines.join('\n');
  if (newContent !== originalContent) {
    fs.writeFileSync(file, newContent, 'utf-8');
    fixed++;
    console.log(`✓ Fixed: ${path.relative(apiDir, file)}`);
  }
}

console.log(`\nDone! Fixed ${fixed} API route files.`);
