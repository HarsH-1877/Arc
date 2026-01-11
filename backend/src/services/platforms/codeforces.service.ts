import axios from 'axios';

export interface CodeforcesUser {
    handle: string;
    rating: number;
    maxRating: number;
    rank: string;
}

export interface CodeforcesRatingChange {
    contestId: number;
    contestName: string;
    handle: string;
    rank: number;
    ratingUpdateTimeSeconds: number;
    oldRating: number;
    newRating: number;
}

export interface CodeforcesSubmission {
    id: number;
    contestId: number;
    problem: {
        tags: string[];
        name: string;
    };
    verdict: 'OK' | string;
    creationTimeSeconds: number;
}

const CF_API_BASE = 'https://codeforces.com/api';

export class CodeforcesService {
    /**
     * Get user info
     */
    static async getUserInfo(handle: string): Promise<CodeforcesUser | null> {
        try {
            const response = await axios.get(`${CF_API_BASE}/user.info`, {
                params: { handles: handle }
            });

            if (response.data.status === 'OK' && response.data.result.length > 0) {
                return response.data.result[0];
            }
            return null;
        } catch (error: any) {
            console.error('Codeforces getUserInfo error:', error.message);
            return null;
        }
    }

    /**
     * Get rating history for backfilling
     */
    static async getRatingHistory(handle: string): Promise<CodeforcesRatingChange[]> {
        try {
            const response = await axios.get(`${CF_API_BASE}/user.rating`, {
                params: { handle }
            });

            if (response.data.status === 'OK') {
                return response.data.result;
            }
            return [];
        } catch (error: any) {
            console.error('Codeforces getRatingHistory error:', error.message);
            return [];
        }
    }

    /**
     * Get user submissions
     */
    static async getUserSubmissions(handle: string, count: number = 100): Promise<CodeforcesSubmission[]> {
        try {
            const response = await axios.get(`${CF_API_BASE}/user.status`, {
                params: { handle, from: 1, count }
            });

            if (response.data.status === 'OK') {
                return response.data.result;
            }
            return [];
        } catch (error: any) {
            console.error('Codeforces getUserSubmissions error:', error.message);
            return [];
        }
    }

    /**
     * Get solved problem count by topic
     */
    static async getTopicBreakdown(handle: string): Promise<Record<string, number>> {
        try {
            const submissions = await this.getUserSubmissions(handle, 500);
            const solvedProblems = new Set<string>();
            const topicCounts: Record<string, number> = {};

            // Get only AC submissions
            const acSubmissions = submissions.filter(sub => sub.verdict === 'OK');

            acSubmissions.forEach(sub => {
                const problemKey = `${sub.contestId}-${sub.problem.name}`;
                if (!solvedProblems.has(problemKey)) {
                    solvedProblems.add(problemKey);

                    // Count topics
                    sub.problem.tags.forEach(tag => {
                        topicCounts[tag] = (topicCounts[tag] || 0) + 1;
                    });
                }
            });

            return topicCounts;
        } catch (error: any) {
            console.error('Codeforces getTopicBreakdown error:', error.message);
            return {};
        }
    }

    /**
     * Verify bio token (user adds token to CF bio)
     */
    static async verifyBioToken(handle: string, token: string): Promise<boolean> {
        try {
            const response = await axios.get(`https://codeforces.com/profile/${handle}`);
            const html = response.data;

            // Simple check if token exists in the profile page
            return html.includes(token);
        } catch (error: any) {
            console.error('Codeforces verifyBioToken error:', error.message);
            return false;
        }
    }

    /**
     * Get daily submission counts for heatmap
     * Returns a map of date string -> submission count
     */
    static async getDailySubmissions(handle: string, days: number = 365): Promise<Map<string, number>> {
        try {
            const response = await axios.get(`${CF_API_BASE}/user.status`, {
                params: { handle, from: 1, count: 10000 }
            });

            if (response.data.status !== 'OK') return new Map();

            const submissions = response.data.result;
            const dailyCounts = new Map<string, number>();
            const cutoffTime = Date.now() / 1000 - (days * 24 * 60 * 60);

            submissions.forEach((sub: any) => {
                if (sub.creationTimeSeconds < cutoffTime) return;

                const date = new Date(sub.creationTimeSeconds * 1000);
                const dateStr = date.toISOString().split('T')[0];

                dailyCounts.set(dateStr, (dailyCounts.get(dateStr) || 0) + 1);
            });

            return dailyCounts;
        } catch (error: any) {
            console.error('Codeforces getDailySubmissions error:', error.message);
            return new Map();
        }
    }
}
