import axios from 'axios';

async function checkCodeforcesAPI() {
    try {
        const handle = 'HarsH_1877'; // Your handle

        console.log(`Fetching rating history for ${handle}...\n`);

        const response = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);

        if (response.data.status === 'OK') {
            const ratingHistory = response.data.result;

            console.log(`Total contests in Codeforces API: ${ratingHistory.length}\n`);

            // Show all contests
            console.log('All contests:');
            ratingHistory.forEach((contest: any, index: number) => {
                const date = new Date(contest.ratingUpdateTimeSeconds * 1000);
                console.log(`${index + 1}. ${date.toISOString().split('T')[0]} - Contest: ${contest.contestName} - Rating: ${contest.newRating}`);
            });

            // Check 180 days filter
            const hundredEightyDaysAgo = Date.now() / 1000 - (180 * 24 * 60 * 60);
            const recentChanges = ratingHistory.filter(
                (change: any) => change.ratingUpdateTimeSeconds >= hundredEightyDaysAgo
            );

            console.log(`\n180 days ago timestamp: ${new Date(hundredEightyDaysAgo * 1000).toISOString()}`);
            console.log(`Contests within 180 days: ${recentChanges.length}`);

        } else {
            console.log('API Error:', response.data);
        }

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

checkCodeforcesAPI();
