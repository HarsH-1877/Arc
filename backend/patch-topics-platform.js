// Patch topics endpoint to add platform filtering
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'compare.routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Patching topics endpoint for platform filtering...\n');

// Step 1: Add platform parameter
const step1Old = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);

        // Verify friendship exists`;

const step1New = `        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);
        const platform = (req.query.platform as string) || 'overall'; // Platform filter

        // Verify friendship exists`;

if (!content.includes('router.get(\\' /: friendId / topics\\', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {')) {
    console.log('❌ Could not find topics endpoint');
} else if (content.includes('const platform = (req.query.platform as string) || \\'overall\\'; // Platform filter') && content.includes('latest_snapshots AS')) {
    console.log('⏭️  Topics endpoint already has platform parameter');
} else {
    // Find the topics endpoint section
    const topicsStart = content.indexOf('router.get(\\' /: friendId / topics\\'');
    const nextRouterGet = content.indexOf('router.get(\\' /: friendId / consistency\\'', topicsStart);

    const topicsSection = content.substring(topicsStart, nextRouterGet);

    if (topicsSection.includes('const userId = req.user!.userId;') && !topicsSection.includes('const platform =')) {
        content = content.replace(step1Old, step1New);
        console.log('✅ Added platform parameter to topics endpoint');
    }
}

// Step 2: Add platform filter to SQL query
const step2Old = `             SELECT user_id, platform, topic_breakdown
             FROM latest_snapshots`,

const step2New = `             SELECT user_id, platform, topic_breakdown
             FROM latest_snapshots
             WHERE $3 = 'overall' OR platform = $3`,

if (content.includes('FROM latest_snapshots') && !content.includes("WHERE $3 = 'overall' OR platform = $3")) {
    content = content.replace(step2Old, step2New);
    console.log('✅ Added platform filter to SQL query');

    // Also update the query parameters
    const paramOld = `            [userId, friendId]`;
    const paramNew = `            [userId, friendId, platform]`;
    content = content.replace(paramOld, paramNew);
    console.log('✅ Added platform parameter to query');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ Topics endpoint patched successfully!\n');
