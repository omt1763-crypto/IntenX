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

let updated = 0;

for (const file of routeFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  
  if (!content.includes("export const dynamic")) {
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
      fs.writeFileSync(file, lines.join('\n'), 'utf-8');
      updated++;
      console.log(`✓ Updated: ${path.relative(apiDir, file)}`);
    }
  }
}

console.log(`\nDone! Updated ${updated} API route files.`);
