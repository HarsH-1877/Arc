// Patch script to add feature flag to consistency endpoint
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'compare.routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Adding feature flag to consistency endpoint...\n');

// Step 1: Add platform parameter and feature flag extraction
const step1Old = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);

        // Verify friendship exists`;

const step1New = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);
        const platform = (req.query.platform as string) || 'overall';
        const useDaily = req.query.useDaily === 'true'; // Feature flag

        // Verify friendship exists`;

if (!content.includes('const useDaily = req.query.useDaily')) {
    content = content.replace(step1Old, step1New);
    console.log('✅ Added feature flag parameter');
}

// Step 2: Add daily_submissions query path before snapshot query
const insertPoint = `        // Get snapshots for last 180 days`;

const newCode = `        // Define mock user emails
        const mockUserEmails = [
            'alice@example.com',
            'bob@example.com',
            'steve@example.com',
            'william@example.com',
            'joe@example.com',
            'virat@example.com'
        ];

        // Check if users are mock users
        const userEmailResult = await pool.query(
            'SELECT id, email FROM users WHERE id IN ($1, $2)',
            [userId, friendId]
        );
        const emailMap = new Map(userEmailResult.rows.map(u => [u.id, u.email]));
        
        const isUserMock = mockUserEmails.includes(emailMap.get(userId) || '');
        const isFriendMock = mockUserEmails.includes(emailMap.get(friendId) || '');

        // Feature flag: Use daily_submissions for real users, snapshots for mock users
        const shouldUseDailySubmissions = useDaily && (!isUserMock || !isFriendMock);

        // Get snapshots for last 180 days`;

if (!content.includes('const shouldUseDailySubmissions')) {
    content = content.replace(insertPoint, newCode);
    console.log('✅ Added feature flag logic and mock user detection');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ Feature flag added successfully!\n');
console.log('Note: Backend logic to query daily_submissions needs to be added manually');
console.log('      The feature flag is ready but endpoint still uses old snapshot logic\n');
