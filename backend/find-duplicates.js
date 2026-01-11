// Script to find and show all mockUserEmails declarations
const fs = require('fs');
const content = fs.readFileSync('src/routes/compare.routes.ts', 'utf8');

const lines = content.split('\n');
const mockUserEmailsLines = [];

lines.forEach((line, idx) => {
    if (line.includes('const mockUserEmails')) {
        mockUserEmailsLines.push(idx + 1); // 1-indexed
    }
});

console.log('Found mockUserEmails declarations at lines:', mockUserEmailsLines);

// Show context around each
mockUserEmailsLines.forEach(lineNum => {
    console.log(`\n=== Around line ${lineNum} ===`);
    const start = Math.max(0, lineNum - 3);
    const end = Math.min(lines.length, lineNum + 10);
    for (let i = start; i < end; i++) {
        console.log(`${i + 1}: ${lines[i]}`);
    }
});
