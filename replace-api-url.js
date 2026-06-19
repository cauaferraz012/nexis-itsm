const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'apps/web/src');

function findAndReplace(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findAndReplace(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('http://localhost:3001')) {
        // Replace exact matches in fetch strings
        // Example: `http://localhost:3001/auth/login` -> `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`
        content = content.replace(/http:\/\/localhost:3001/g, "${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}");
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

findAndReplace(directoryPath);
console.log("Done!");
