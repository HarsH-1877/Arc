// Updated consistency endpoint with platform filtering and real submission deltas
// To be integrated into compare.routes.ts

router.get('/:friendId/consistency', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);
        const platform = (req.query.platform as string) || 'overall'; // NEW: Add platform parameter

        // Verify friendship exists
        const friendCheck = await pool.query(
            'SELECT id FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [userId, friendId]
        );

        if (friendCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'Not friends with this user'
            });
        }

        // Get snapshots for last 180 days (6 months) for both users
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

        // NEW: Build query based on platform, include total_solved for delta calculations
        let query = `
            SELECT user_id, platform, DATE(timestamp) as date, 
                   MAX(total_solved) as total_solved,
                   MAX(timestamp) as latest_timestamp
            FROM snapshots
            WHERE user_id IN ($1, $2) AND timestamp >= $3`;

        const params: any[] = [userId, friendId, sixMonthsAgo];

        if (platform !== 'overall') {
            query += ` AND platform = $4`;
            params.push(platform);
        }

        query += ` GROUP BY user_id, platform, DATE(timestamp)
                   ORDER BY user_id, platform, date ASC`;

        const snapshotsResult = await pool.query(query, params);

        // Get usernames
        const usersResult = await pool.query(
            'SELECT id, username FROM users WHERE id IN ($1, $2)',
            [userId, friendId]
        );
        const userMap = new Map(usersResult.rows.map(u => [u.id, u.username]));

        // Helper function to calculate daily submission deltas
        const calculateDailyDeltas = (snapshots: any[], userId: number) => {
            const dailyData = new Map<string, number>();

            // Group by date, sum all platforms for 'overall'
            const dateGroups = new Map<string, number>();

            for (const snap of snapshots) {
                if (snap.user_id !== userId) continue;
                const dateStr = snap.date.toISOString().split('T')[0];
                const solved = parseInt(snap.total_solved) || 0;

                // For 'overall', sum across platforms
                if (platform === 'overall') {
                    dateGroups.set(dateStr, (dateGroups.get(dateStr) || 0) + solved);
                } else {
                    dateGroups.set(dateStr, solved);
                }
            }

            // Calculate deltas between consecutive days
            const sortedDates = Array.from(dateGroups.keys()).sort();
            let prevSolved = 0;

            for (const dateStr of sortedDates) {
                const currentSolved = dateGroups.get(dateStr) || 0;
                const delta = Math.max(0, currentSolved - prevSolved); // Submissions that day

                if (delta > 0) {
                    dailyData.set(dateStr, delta);
                }

                prevSolved = currentSolved;
            }

            return dailyData;
        };

        // Process data for each user
        const userDailyActivity = new Map<string, number>();
        const friendDailyActivity = new Map<string, number>();

        // Define mock user emails
        const mockUserEmails = [
            'alice@example.com',
            'bob@example.com',
            'steve@example.com',
            'william@example.com',
            'joe@example.com',
            'virat@example.com'
        ];

        // Check if users are mock users
        const userEmailResult = await pool.query(
            'SELECT id, email FROM users WHERE id IN ($1, $2)',
            [userId, friendId]
        );
        const emailMap = new Map(userEmailResult.rows.map(u => [u.id, u.email]));

        const isUserMock = mockUserEmails.includes(emailMap.get(userId) || '');
        const isFriendMock = mockUserEmails.includes(emailMap.get(friendId) || '');

        // For mock users: use random generation (for demo variety)
        // For real users: calculate actual deltas
        if (isUserMock) {
            // Mock user - use seeded random
            const userRandom = (() => {
                let seed = userId * 12345;
                return () => {
                    const x = Math.sin(seed++) * 10000;
                    return x - Math.floor(x);
                };
            })();

            snapshotsResult.rows.forEach(row => {
                if (row.user_id !== userId) return;
                const dateStr = row.date.toISOString().split('T')[0];
                const count = Math.floor(userRandom() * 8) + 1;
                userDailyActivity.set(dateStr, count);
            });
        } else {
            // Real user - calculate actual deltas
            const deltas = calculateDailyDeltas(snapshotsResult.rows, userId);
            deltas.forEach((count, date) => userDailyActivity.set(date, count));
        }

        if (isFriendMock) {
            // Mock friend - use seeded random
            const friendRandom = (() => {
                let seed = friendId * 12345;
                return () => {
                    const x = Math.sin(seed++) * 10000;
                    return x - Math.floor(x);
                };
            })();

            snapshotsResult.rows.forEach(row => {
                if (row.user_id !== friendId) return;
                const dateStr = row.date.toISOString().split('T')[0];
                const count = Math.floor(friendRandom() * 8) + 1;
                friendDailyActivity.set(dateStr, count);
            });
        } else {
            // Real friend - calculate actual deltas  
            const deltas = calculateDailyDeltas(snapshotsResult.rows, friendId);
            deltas.forEach((count, date) => friendDailyActivity.set(date, count));
        }

        // ... rest of the function (calculateMetrics, etc.) remains the same

    } catch (error: any) {
        console.error('Get consistency error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch consistency data'
        });
    }
});
