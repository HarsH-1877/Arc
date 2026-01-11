// Emergency rollback - remove duplicate declarations
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'compare.routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🚨 EMERGENCY ROLLBACK - Removing duplicate declarations...\n');

// Remove the duplicate declaration block I added
const duplicateBlock = `        // Define mock user emails
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

        `;

content = content.replace(duplicateBlock, '        ');

// Also remove the useDaily and platform additions if they cause issues
const removePlatform = `        const platform = (req.query.platform as string) || 'overall';
        const useDaily = req.query.useDaily === 'true'; // Feature flag

        `;

content = content.replace(removePlatform, '        ');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Removed duplicate declarations');
console.log('✅ Backend should restart automatically\n');
