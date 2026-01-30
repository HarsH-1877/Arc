// Debug mock user overall mode
import pool from './src/config/database';

async function debugMockUserOverall() {
    try {
        const userId = 1; // Alice (mock user)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

        console.log('🔍 Debugging mock user (Alice) overall mode...\n');

        // Check what snapshots are returned for overall
        const overallSnapshots = await pool.query(
            `SELECT user_id, platform, DATE(timestamp) as date
             FROM snapshots
             WHERE user_id = $1 AND timestamp >= $2
             ORDER BY date ASC
             LIMIT 10`,
            [userId, sixMonthsAgo]
        );

        console.log(`Snapshots for overall mode (first 10):`);
        overallSnapshots.rows.forEach(row => {
            console.log(`   ${row.date.toISOString().split('T')[0]}: ${row.platform}`);
        });

        // Simulate the random generation  
        console.log('\n📊 Simulating random generation:\n');

        const createSeededRandom = (seed: number) => {
            let current = seed;
            return () => {
                const x = Math.sin(current++) * 10000;
                return x - Math.floor(x);
            };
        };

        // Overall mode
        const cfSeed = userId * 12345 + 3333;
        const lcSeed = userId * 12345 + 7777;
        const cfRandom = createSeededRandom(cfSeed);
        const lcRandom = createSeededRandom(lcSeed);

        const overallActivity = new Map<string, number>();

        overallSnapshots.rows.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];
            const random = row.platform === 'codeforces' ? cfRandom() : lcRandom();
            const count = Math.floor(random * 8) + 1;
            const existing = overallActivity.get(dateStr) || 0;
            overallActivity.set(dateStr, existing + count);
        });

        console.log('Overall mode (first 5 dates):');
        let shown = 0;
        for (const [date, count] of overallActivity.entries()) {
            if (shown++ >= 5) break;
            console.log(`   ${date}: ${count} submissions`);
        }

        // CF only
        console.log('\nCF only (first 5):');
        const cfOnlyRandom = createSeededRandom(userId * 12345 + 3333);
        const cfSnapshots = overallSnapshots.rows.filter(r => r.platform === 'codeforces').slice(0, 5);
        cfSnapshots.forEach(row => {
            const count = Math.floor(cfOnlyRandom() * 8) + 1;
            console.log(`   ${row.date.toISOString().split('T')[0]}: ${count} submissions`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

debugMockUserOverall();
