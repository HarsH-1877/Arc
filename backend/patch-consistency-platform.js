// PowerShell script to patch the consistency endpoint
// This will be executed as a batch of changes

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'compare.routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Patching consistency endpoint...\n');

// Step 1: Add platform parameter extraction
const step1Old = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);`;

const step1New = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);
        const platform = (req.query.platform as string) || 'overall'; // Platform filter`;

if (content.includes(step1Old) && !content.includes('const platform = (req.query.platform as string)')) {
    content = content.replace(step1Old, step1New);
    console.log('✅ Step 1: Added platform parameter');
} else {
    console.log('⏭️  Step 1: Already applied or not found');
}

// Step 2: Update the snapshots query to include total_solved and platform filtering
const step2Old = `        const snapshotsResult = await pool.query(
            \`SELECT DISTINCT user_id, DATE(timestamp) as date
             FROM snapshots
             WHERE user_id IN ($1, $2) AND timestamp >= $3
             GROUP BY user_id, DATE(timestamp)
             ORDER BY user_id, date ASC\`,
            [userId, friendId, sixMonthsAgo]
        );`;

const step2New = `        // Build query based on platform
        let query = \`
            SELECT user_id, platform, DATE(timestamp) as date, 
                   MAX(total_solved) as total_solved
            FROM snapshots
            WHERE user_id IN ($1, $2) AND timestamp >= $3\`;
        
        const params: any[] = [userId, friendId, sixMonthsAgo];
        
        if (platform !== 'overall') {
            query += \` AND platform = $4\`;
            params.push(platform);
        }
        
        query += \` GROUP BY user_id, platform, DATE(timestamp)
                   ORDER BY user_id, platform, date ASC\`;

        const snapshotsResult = await pool.query(query, params);`;

if (content.includes('SELECT DISTINCT user_id, DATE(timestamp) as date') && !content.includes('MAX(total_solved)')) {
    content = content.replace(step2Old, step2New);
    console.log('✅ Step 2: Updated snapshots query');
} else {
    console.log('⏭️  Step 2: Already applied or not found');
}

// Write the updated file
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ Consistency endpoint patched successfully!');
console.log('🔄 Server should auto-reload with the changes.\n');
