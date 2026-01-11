// Careful fix for topics endpoint - add platform filtering
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'compare.routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Adding platform filtering to topics endpoint...\n');

// Step 1: Add platform parameter extraction
const old1 = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);

        // Verify friendship exists`;

const new1 = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);
        const platform = (req.query.platform as string) || 'overall';

        // Verify friendship exists`;

if (!content.includes("/:friendId/topics") || content.includes("const platform = (req.query.platform as string) || 'overall';")) {
    console.log('⏭️  Platform parameter already exists or topics endpoint not found');
} else {
    // Find the topics section
    const topicsIdx = content.indexOf("router.get('/:friendId/topics'");
    const nextIdx = content.indexOf("router.get('/:friendId/consistency'", topicsIdx);
    const topicsSection = content.substring(topicsIdx, nextIdx);

    if (topicsSection.includes(old1)) {
        content = content.replace(old1, new1);
        console.log('✅ Added platform parameter');
    }
}

// Step 2: Update SQL query to filter by platform
const old2 = `             SELECT user_id, platform, topic_breakdown
             FROM latest_snapshots`;

const new2 = `             SELECT user_id, platform, topic_breakdown
             FROM latest_snapshots
             WHERE $3 = 'overall' OR platform = $3`;

if (content.includes('FROM latest_snapshots') && !content.includes("WHERE $3 = 'overall'")) {
    content = content.replace(old2, new2);
    console.log('✅ Added WHERE clause for platform filtering');

    // Update query parameters from [userId, friendId] to [userId, friendId, platform]
    // Find the parameters line that comes after latest_snapshots
    const paramsOld = `            [userId, friendId]
        );`;
    const paramsNew = `            [userId, friendId, platform]
        );`;

    content = content.replace(paramsOld, paramsNew);
    console.log('✅ Updated query parameters');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ Topics endpoint updated!\n');
