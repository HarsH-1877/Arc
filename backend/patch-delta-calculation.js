// Comprehensive patch to add delta calculation logic
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'compare.routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Patching consistency endpoint - adding delta calculation...\n');

// Find and replace the data processing section
const oldProcessing = `        // Process data for each user
        const userDailyActivity = new Map<string, number>();
        const friendDailyActivity = new Map<string, number>();

        // Define mock user emails (these get random data, real accounts get actual activity count)
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

        // Create seeded random function for consistent randomness per user
        const createSeededRandom = (seed: number) => {
            let current = seed;
            return () => {
                const x = Math.sin(current++) * 10000;
                return x - Math.floor(x);
            };
        };

        const userRandom = createSeededRandom(userId * 12345);
        const friendRandom = createSeededRandom(friendId * 12345);

        snapshotsResult.rows.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];
            
            // For mock users: random submissions (1-8). For real users: just mark as active (1)
            const isMock = row.user_id === userId ? isUserMock : isFriendMock;
            const random = row.user_id === userId ? userRandom() : friendRandom();
            const count = isMock ? Math.floor(random * 8) + 1 : 1;
            
            if (row.user_id === userId) {
                userDailyActivity.set(dateStr, count);
            } else {
                friendDailyActivity.set(dateStr, count);
            }
        });`;

const newProcessing = `        // Helper function to calculate daily submission deltas from consecutive snapshots
        const calculateDailyDeltas = (snapshots: any[], targetUserId: number) => {
            const dailyData = new Map<string, number>();
            
            // Group by date, handle multiple platforms for 'overall'
            const dateGroups = new Map<string, { platforms: Map<string, number> }>();
            
            for (const snap of snapshots) {
                if (snap.user_id !== targetUserId) continue;
                const dateStr = snap.date.toISOString().split('T')[0];
                const solved = parseInt(snap.total_solved) || 0;
                const snapPlatform = snap.platform;
                
                if (!dateGroups.has(dateStr)) {
                    dateGroups.set(dateStr, { platforms: new Map() });
                }
                dateGroups.get(dateStr)!.platforms.set(snapPlatform, solved);
            }
            
            // Sort dates and calculate deltas
            const sortedDates = Array.from(dateGroups.keys()).sort();
            const prevSolved = new Map<string, number>(); // Track per platform
            
            for (const dateStr of sortedDates) {
                const group = dateGroups.get(dateStr)!;
                let dayTotal = 0;
                
                // Calculate delta for each platform
                group.platforms.forEach((currentSolved, snapPlatform) => {
                    const prev = prevSolved.get(snapPlatform) || 0;
                    const delta = Math.max(0, currentSolved - prev);
                    dayTotal += delta;
                    prevSolved.set(snapPlatform, currentSolved);
                });
                
                if (dayTotal > 0) {
                    dailyData.set(dateStr, dayTotal);
                }
            }
            
            return dailyData;
        };

        // Process data for each user
        const userDailyActivity = new Map<string, number>();
        const friendDailyActivity = new Map<string, number>();

        // Define mock user emails
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

        // Create seeded random for mock users
        const createSeededRandom = (seed: number) => {
            let current = seed;
            return () => {
                const x = Math.sin(current++) * 10000;
                return x - Math.floor(x);
            };
        };

        // Process user data
        if (isUserMock) {
            const userRandom = createSeededRandom(userId * 12345);
            snapshotsResult.rows.forEach(row => {
                if (row.user_id !== userId) return;
                const dateStr = row.date.toISOString().split('T')[0];
                const count = Math.floor(userRandom() * 8) + 1;
                userDailyActivity.set(dateStr, count);
            });
        } else {
            const deltas = calculateDailyDeltas(snapshotsResult.rows, userId);
            deltas.forEach((count, date) => userDailyActivity.set(date, count));
        }

        // Process friend data
        if (isFriendMock) {
            const friendRandom = createSeededRandom(friendId * 12345);
            snapshotsResult.rows.forEach(row => {
                if (row.user_id !== friendId) return;
                const dateStr = row.date.toISOString().split('T')[0];
                const count = Math.floor(friendRandom() * 8) + 1;
                friendDailyActivity.set(dateStr, count);
            });
        } else {
            const deltas = calculateDailyDeltas(snapshotsResult.rows, friendId);
            deltas.forEach((count, date) => friendDailyActivity.set(date, count));
        }`;

if (content.includes('// For mock users: random submissions (1-8). For real users: just mark as active (1)')) {
    content = content.replace(oldProcessing, newProcessing);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Added delta calculation logic');
    console.log('✅ Real users now calculate actual daily submissions from snapshots');
    console.log('✅ Mock users still use random generation for variety\n');
} else {
    console.log('❌ Could not find old processing code to replace');
    console.log('The code may have already been updated or structure changed\n');
}
