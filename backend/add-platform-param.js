// Comprehensive patch for consistency endpoint - adds platform parameter line
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'compare.routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Patching consistency endpoint - adding platform parameter...\n');

// Add platform parameter after friendId
const oldLine = `        const friendId = parseInt(req.params.friendId);`;
const newLines = `        const friendId = parseInt(req.params.friendId);
        const platform = (req.query.platform as string) || 'overall';`;

if (!content.includes("const platform = (req.query.platform")) {
    content = content.replace(oldLine, newLines);
    console.log('✅ Added platform parameter');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ File updated successfully!\n');
} else {
    console.log('Platform parameter already exists\n');
}
