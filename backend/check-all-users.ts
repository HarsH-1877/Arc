import pool from './src/config/database';

async function checkAllUsers() {
    try {
        console.log('📊 All users and their snapshots:\n');

        const usersResult = await pool.query(
            `SELECT u.id, u.username, u.email,
                    COUNT(DISTINCT CASE WHEN s.platform = 'codeforces' THEN s.id END) as cf_count,
                    COUNT(DISTINCT CASE WHEN s.platform = 'leetcode' THEN s.id END) as lc_count,
                    MAX(CASE WHEN s.platform = 'codeforces' THEN s.timestamp END) as cf_latest,
                    MIN(CASE WHEN s.platform = 'codeforces' THEN s.timestamp END) as cf_oldest
             FROM users u
             LEFT JOIN snapshots s ON u.id = s.user_id
             GROUP BY u.id, u.username, u.email
             ORDER BY u.id`
        );

        usersResult.rows.forEach(user => {
            console.log(`\n${user.username} (${user.email})`);
            console.log(`  CF snapshots: ${user.cf_count} | LC snapshots: ${user.lc_count}`);
            if (user.cf_oldest) {
                console.log(`  CF date range: ${new Date(user.cf_oldest).toISOString().split('T')[0]} to ${new Date(user.cf_latest).toISOString().split('T')[0]}`);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkAllUsers();
