import pool from './src/config/database';

async function checkAliceSnapshots() {
    try {
        const result = await pool.query(
            `SELECT timestamp::date, rating 
             FROM snapshots 
             WHERE user_id = 12 AND platform = 'codeforces'
             ORDER BY timestamp ASC`
        );

        console.log(`Alice's Codeforces snapshots (${result.rows.length} total):\n`);
        result.rows.forEach((row, i) => {
            console.log(`${i + 1}. ${row.timestamp} - Rating: ${row.rating}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkAliceSnapshots();
