import pool from './src/config/database';
import bcryptjs from 'bcryptjs';

async function createMockUsers() {
    try {
        console.log('🎭 Creating fresh mock users with realistic data...\n');

        // Create User 1: Alice
        console.log('Creating Alice...');
        const alicePassword = await bcryptjs.hash('password123', 10);
        const alice = await pool.query(
            `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) RETURNING id`,
            ['alice_coder', 'alice@example.com', alicePassword]
        );
        const aliceId = alice.rows[0].id;

        // Create User 2: Bob
        console.log('Creating Bob...');
        const bobPassword = await bcryptjs.hash('password123', 10);
        const bob = await pool.query(
            `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) RETURNING id`,
            ['bob_dev', 'bob@example.com', bobPassword]
        );
        const bobId = bob.rows[0].id;

        // Create User 3: Steve
        console.log('Creating Steve...');
        const stevePassword = await bcryptjs.hash('Steve123', 10);
        const steve = await pool.query(
            `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) RETURNING id`,
            ['Steve', 'steve@example.com', stevePassword]
        );
        const steveId = steve.rows[0].id;

        // Create User 4: William
        console.log('Creating William...');
        const williamPassword = await bcryptjs.hash('William123', 10);
        const william = await pool.query(
            `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) RETURNING id`,
            ['William', 'william@example.com', williamPassword]
        );
        const williamId = william.rows[0].id;

        // Create User 5: Joe
        console.log('Creating Joe...');
        const joePassword = await bcryptjs.hash('Joe123', 10);
        const joe = await pool.query(
            `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) RETURNING id`,
            ['Joe', 'joe@example.com', joePassword]
        );
        const joeId = joe.rows[0].id;

        // Create User 6: Virat
        console.log('Creating Virat...');
        const viratPassword = await bcryptjs.hash('Virat123', 10);
        const virat = await pool.query(
            `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) RETURNING id`,
            ['Virat', 'virat@example.com', viratPassword]
        );
        const viratId = virat.rows[0].id;

        // Add platform handles for Alice
        console.log('\nAdding platform handles for Alice...');
        await pool.query(
            `INSERT INTO platform_handles (user_id, platform, handle, current_rating) 
             VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
            [aliceId, 'codeforces', 'alice_cf', 1450, 'leetcode', 'alice_lc', 1820]
        );

        // Add platform handles for Bob
        console.log('Adding platform handles for Bob...');
        await pool.query(
            `INSERT INTO platform_handles (user_id, platform, handle, current_rating) 
             VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
            [bobId, 'codeforces', 'bob_cf', 1320, 'leetcode', 'bob_lc', 1650]
        );

        // Add platform handles for Steve
        console.log('Adding platform handles for Steve...');
        await pool.query(
            `INSERT INTO platform_handles (user_id, platform, handle, current_rating) 
             VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
            [steveId, 'codeforces', 'steve_cf', 1580, 'leetcode', 'steve_lc', 1950]
        );

        // Add platform handles for William
        console.log('Adding platform handles for William...');
        await pool.query(
            `INSERT INTO platform_handles (user_id, platform, handle, current_rating) 
             VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
            [williamId, 'codeforces', 'william_cf', 1150, 'leetcode', 'william_lc', 1420]
        );

        // Add platform handles for Joe
        console.log('Adding platform handles for Joe...');
        await pool.query(
            `INSERT INTO platform_handles (user_id, platform, handle, current_rating) 
             VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
            [joeId, 'codeforces', 'joe_cf', 1620, 'leetcode', 'joe_lc', 2050]
        );

        // Add platform handles for Virat (HIGHEST RATED)
        console.log('Adding platform handles for Virat...');
        await pool.query(
            `INSERT INTO platform_handles (user_id, platform, handle, current_rating) 
             VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
            [viratId, 'codeforces', 'virat_cf', 1850, 'leetcode', 'virat_lc', 2250]
        );

        // Generate snapshots for all users
        console.log('\nGenerating 90 days of snapshots for all users...');
        const allSnapshots = [];

        // User data: [userId, cfStart, cfEnd, lcStart, lcEnd, cfSolvedStart, cfSolvedEnd, lcSolvedStart, lcSolvedEnd, pattern]
        // Growth patterns: 'steady', 'fast-start', 'late-bloom', 'plateau', 'volatile'
        const userData = [
            [aliceId, 1200, 1450, 1500, 1820, 100, 250, 150, 400, 'steady'],
            [bobId, 1100, 1320, 1400, 1650, 80, 200, 120, 320, 'plateau'],
            [steveId, 1350, 1580, 1700, 1950, 130, 310, 180, 460, 'fast-start'],
            [williamId, 950, 1150, 1200, 1420, 70, 180, 100, 280, 'late-bloom'],
            [joeId, 1450, 1620, 1850, 2050, 145, 325, 190, 480, 'volatile'],
            [viratId, 1550, 1850, 2000, 2250, 160, 370, 220, 530, 'steady'] // HIGHEST RATING
        ];

        for (const [userId, cfStart, cfEnd, lcStart, lcEnd, cfSolvedStart, cfSolvedEnd, lcSolvedStart, lcSolvedEnd, pattern] of userData) {
            let cfCurrent = cfStart;
            let lcCurrent = lcStart;

            for (let i = 90; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const progress = (90 - i) / 90; // 0 to 1

                // Apply different growth patterns for realistic variation
                let cfGrowth, lcGrowth;

                switch (pattern) {
                    case 'steady':
                        // Smooth growth with small random variations
                        cfGrowth = cfStart + (cfEnd - cfStart) * progress;
                        lcGrowth = lcStart + (lcEnd - lcStart) * progress;
                        cfCurrent = cfGrowth + (Math.random() - 0.5) * 25;
                        lcCurrent = lcGrowth + (Math.random() - 0.5) * 30;
                        break;

                    case 'fast-start':
                        // Fast growth at start, then slows down
                        cfGrowth = cfStart + (cfEnd - cfStart) * Math.sqrt(progress);
                        lcGrowth = lcStart + (lcEnd - lcStart) * Math.sqrt(progress);
                        cfCurrent = cfGrowth + (Math.random() - 0.5) * 30;
                        lcCurrent = lcGrowth + (Math.random() - 0.5) * 35;
                        break;

                    case 'late-bloom':
                        // Slow start, accelerates later (creates line crossovers)
                        cfGrowth = cfStart + (cfEnd - cfStart) * Math.pow(progress, 2);
                        lcGrowth = lcStart + (lcEnd - lcStart) * Math.pow(progress, 2);
                        cfCurrent = cfGrowth + (Math.random() - 0.5) * 20;
                        lcCurrent = lcGrowth + (Math.random() - 0.5) * 25;
                        break;

                    case 'plateau':
                        // Growth with visible plateaus
                        const plateauFactor = Math.floor(progress * 4) / 4; // Creates step plateaus
                        cfGrowth = cfStart + (cfEnd - cfStart) * plateauFactor;
                        lcGrowth = lcStart + (lcEnd - lcStart) * plateauFactor;
                        cfCurrent = cfGrowth + (Math.random() - 0.5) * 35;
                        lcCurrent = lcGrowth + (Math.random() - 0.5) * 40;
                        break;

                    case 'volatile':
                        // Lots of ups and downs (wave pattern)
                        cfGrowth = cfStart + (cfEnd - cfStart) * progress;
                        lcGrowth = lcStart + (lcEnd - lcStart) * progress;
                        const volatility = Math.sin(progress * 15) * 50; // Creates waves
                        cfCurrent = cfGrowth + volatility + (Math.random() - 0.5) * 40;
                        lcCurrent = lcGrowth + volatility + (Math.random() - 0.5) * 45;
                        break;
                }

                // Ensure ratings don't go too far below start values
                cfCurrent = Math.max(cfStart - 50, cfCurrent);
                lcCurrent = Math.max(lcStart - 50, lcCurrent);

                const cfRating = Math.round(cfCurrent);
                const cfSolved = Math.round(cfSolvedStart + (cfSolvedEnd - cfSolvedStart) * progress);

                allSnapshots.push([
                    userId, 'codeforces', date, cfRating, cfSolved,
                    JSON.stringify({
                        'Arrays': Math.floor(cfSolved * 0.25),
                        'Dynamic Programming': Math.floor(cfSolved * 0.15),
                        'Graphs': Math.floor(cfSolved * 0.12),
                        'Math': Math.floor(cfSolved * 0.18),
                        'Greedy': Math.floor(cfSolved * 0.10),
                        'Trees': Math.floor(cfSolved * 0.08)
                    })
                ]);

                const lcRating = Math.round(lcCurrent);
                const lcSolved = Math.round(lcSolvedStart + (lcSolvedEnd - lcSolvedStart) * progress);

                allSnapshots.push([
                    userId, 'leetcode', date, lcRating, lcSolved,
                    JSON.stringify({
                        'Arrays': Math.floor(lcSolved * 0.28),
                        'Hash Table': Math.floor(lcSolved * 0.20),
                        'String': Math.floor(lcSolved * 0.16),
                        'Two Pointers': Math.floor(lcSolved * 0.12),
                        'Binary Search': Math.floor(lcSolved * 0.10),
                        'Sliding Window': Math.floor(lcSolved * 0.08)
                    })
                ]);
            }
        }

        // Insert all snapshots
        console.log('\nInserting snapshots into database...');
        for (const snapshot of allSnapshots) {
            await pool.query(
                `INSERT INTO snapshots (user_id, platform, timestamp, rating, total_solved, topic_breakdown) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                snapshot
            );
        }

        // Create friendships (everyone is friends with everyone)
        console.log('\nCreating friendships...');
        const userIds = [aliceId, bobId, steveId, williamId, joeId, viratId];
        for (let i = 0; i < userIds.length; i++) {
            for (let j = i + 1; j < userIds.length; j++) {
                await pool.query(
                    `INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)`,
                    [userIds[i], userIds[j]]
                );
            }
        }

        console.log('\n✅ Mock users created successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('   Alice: alice@example.com / password123');
        console.log('   Bob: bob@example.com / password123');
        console.log('   Steve: steve@example.com / Steve123');
        console.log('   William: william@example.com / William123');
        console.log('   Joe: joe@example.com / Joe123');
        console.log('   Virat: virat@example.com / Virat123');
        console.log('\n📊 Data Summary:');
        console.log('   - 6 users created');
        console.log('   - 12 platform handles (2 per user)');
        console.log('   - 1,092 snapshots (91 days × 2 platforms × 6 users)');
        console.log('   - 15 friendship connections (everyone is friends)');

    } catch (error) {
        console.error('❌ Error creating mock users:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

createMockUsers();
