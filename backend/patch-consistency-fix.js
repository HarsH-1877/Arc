// Quick patch to fix the submission count logic for real vs mock users
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'compare.routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the random submission count logic
const oldCode = `            // Generate random submission count (1-8 problems per day) using seeded random
            const random = row.user_id === userId ? userRandom() : friendRandom();
            const count = Math.floor(random * 8) + 1; // 1 to 8 submissions`;

const newCode = `            // For mock users: random submissions (1-8). For real users: just mark as active (1)
            const isMock = row.user_id === userId ? isUserMock : isFriendMock;
            const random = row.user_id === userId ? userRandom() : friendRandom();
            const count = isMock ? Math.floor(random * 8) + 1 : 1`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Successfully patched compare.routes.ts');
    console.log('Real accounts will now show count=1 per active day instead of random counts');
} else {
    console.log('❌ Could not find the old code to replace. File may have already been patched.');
}
