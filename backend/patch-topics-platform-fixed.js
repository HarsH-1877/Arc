// Patch topics endpoint to add platform filtering (fixed syntax)
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'compare.routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Patching topics endpoint for platform filtering...\n');

// Step 1: Add platform parameter after friendId
const step1Old = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);

        // Verify friendship exists`;

const step1New = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);
        const platform = (req.query.platform as string) || 'overall';

        // Verify friendship exists`;

// Check if we're in the topics section and add platform param
if (content.includes("router.get('/:friendId/topics'") && !content.includes('// Platform filter')) {
    const topicsIdx = content.indexOf("router.get('/:friendId/topics'");
    const consistencyIdx = content.indexOf("router.get('/:friendId/consistency'");
    const topicsSection = content.substring(topicsIdx, consistencyIdx);

    if (!topicsSection.includes('const platform =')) {
        content = content.replace(step1Old, step1New);
        console.log('✅ Step 1: Added platform parameter to topics endpoint');
    }
} else {
    console.log('⏭️  Step 1: Platform parameter already exists or topics endpoint not found');
}

// Step 2: Add WHERE clause to filter by platform
const old Query = `             SELECT user_id, platform, topic_breakdown
             FROM latest_snapshots`;

const newQuery = `             SELECT user_id, platform, topic_breakdown
             FROM latest_snapshots
             WHERE $3 = 'overall' OR platform = $3`;

if (content.includes('FROM latest_snapshots') && !content.includes("WHERE $3 = 'overall'")) {
    content = content.replace(oldQuery, newQuery);

    // Update query parameters
    const paramOld = `            [userId, friendId]`;
    const paramNew = `            [userId, friendId, platform]`;

    if (content.includes(paramOld)) {
        content = content.replace(paramOld, paramNew);
        console.log('✅ Step 2: Added platform filtering to SQL and updated parameters');
    }
} else {
    console.log('⏭️  Step 2: Platform filtering already exists');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ Topics endpoint patched successfully!\n');
