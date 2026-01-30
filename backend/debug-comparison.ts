import pool from './src/config/database';

async function checkComparisonData() {
    try {
        // Get alice_coder's ID
        const aliceResult = await pool.query(
            `SELECT id FROM users WHERE email = 'alice@example.com'`
        );
        const aliceId = aliceResult.rows[0]?.id;

        // Get Virat's ID
        const viratResult = await pool.query(
            `SELECT id FROM users WHERE email = 'virat@example.com'`
        );
        const viratId = viratResult.rows[0]?.id;

        console.log(`Alice ID: ${aliceId}, Virat ID: ${viratId}\n`);

        // Check 180 days ago
        const hundredEightyDaysAgo = new Date();
        hundredEightyDaysAgo.setDate(hundredEightyDaysAgo.getDate() - 180);
        console.log(`180 days ago: ${hundredEightyDaysAgo.toISOString()}\n`);

        // Get Alice's CF snapshots
        const aliceCF = await pool.query(
            `SELECT timestamp, rating FROM snapshots 
             WHERE user_id = $1 AND platform = 'codeforces' AND timestamp >= $2
             ORDER BY timestamp ASC`,
            [aliceId, hundredEightyDaysAgo]
        );

        console.log(`Alice (Codeforces) - ${aliceCF.rows.length} snapshots:`);
        aliceCF.rows.forEach(s => {
            console.log(`  ${new Date(s.timestamp).toISOString().split('T')[0]} - ${s.rating}`);
        });

        // Get Virat's CF snapshots  
        const viratCF = await pool.query(
            `SELECT timestamp, rating FROM snapshots 
             WHERE user_id = $1 AND platform = 'codeforces' AND timestamp >= $2
             ORDER BY timestamp ASC`,
            [viratId, hundredEightyDaysAgo]
        );

        console.log(`\nVirat (Codeforces) - ${viratCF.rows.length} snapshots:`);
        console.log(`  First: ${new Date(viratCF.rows[0]?.timestamp).toISOString().split('T')[0]}`);
        console.log(`  Last: ${new Date(viratCF.rows[viratCF.rows.length - 1]?.timestamp).toISOString().split('T')[0]}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkComparisonData();
