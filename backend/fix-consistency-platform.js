// Careful fix for consistency endpoint - add platform filtering
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'compare.routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Adding platform filtering to consistency endpoint...\n');

// Step 1: Add platform parameter extraction (after friendId)
const consistencyIdx = content.indexOf("router.get('/:friendId/consistency'");
const after = content.substring(consistencyIdx, consistencyIdx + 500);

if (!after.includes("const platform = (req.query.platform as string)")) {
    const old1 = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);

        // Verify friendship exists
        const friendCheck`;

    const new1 = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);
        const platform = (req.query.platform as string) || 'overall';

        // Verify friendship exists
        const friendCheck`;

    // Only replace in consistency section
    const beforeConsistency = content.substring(0, consistencyIdx);
    let consistencySection = content.substring(consistencyIdx);
    consistencySection = consistencySection.replace(old1, new1);
    content = beforeConsistency + consistencySection;
    console.log('✅ Added platform parameter to consistency endpoint');
}

// Step 2: Update snapshots SQL query to include platform filtering
const old2 = `        const snapshotsResult = await pool.query(
            \`SELECT DISTINCT user_id, DATE(timestamp) as date
             FROM snapshots
             WHERE user_id IN ($1, $2) AND timestamp >= $3
             GROUP BY user_id, DATE(timestamp)
             ORDER BY user_id, date ASC\`,
            [userId, friendId, sixMonthsAgo]
        );`;

const new2 = `        let snapshotsQuery = \`
            SELECT DISTINCT user_id, DATE(timestamp) as date
            FROM snapshots
            WHERE user_id IN ($1, $2) AND timestamp >= $3\`;
        const snapshotsParams: any[] = [userId, friendId, sixMonthsAgo];
        
        if (platform !== 'overall') {
            snapshotsQuery += \` AND platform = $4\`;
            snapshotsParams.push(platform);
        }
        
        snapshotsQuery += \`
            GROUP BY user_id, DATE(timestamp)
            ORDER BY user_id, date ASC\`;
        
        const snapshotsResult = await pool.query(snapshotsQuery, snapshotsParams);`;

if (content.includes('SELECT DISTINCT user_id, DATE(timestamp) as date') && !content.includes('snapshotsParams')) {
    content = content.replace(old2, new2);
    console.log('✅ Added platform filtering to snapshots query');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ Consistency endpoint updated!\n');
