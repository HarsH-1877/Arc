"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeforcesService = void 0;
const axios_1 = __importDefault(require("axios"));
const CF_API_BASE = 'https://codeforces.com/api';
class CodeforcesService {
    /**
     * Get user info
     */
    static async getUserInfo(handle) {
        try {
            const response = await axios_1.default.get(`${CF_API_BASE}/user.info`, {
                params: { handles: handle }
            });
            if (response.data.status === 'OK' && response.data.result.length > 0) {
                return response.data.result[0];
            }
            return null;
        }
        catch (error) {
            console.error('Codeforces getUserInfo error:', error.message);
            return null;
        }
    }
    /**
     * Get rating history for backfilling
     */
    static async getRatingHistory(handle) {
        try {
            const response = await axios_1.default.get(`${CF_API_BASE}/user.rating`, {
                params: { handle }
            });
            if (response.data.status === 'OK') {
                return response.data.result;
            }
            return [];
        }
        catch (error) {
            console.error('Codeforces getRatingHistory error:', error.message);
            return [];
        }
    }
    /**
     * Get user submissions
     */
    static async getUserSubmissions(handle, count = 100) {
        try {
            const response = await axios_1.default.get(`${CF_API_BASE}/user.status`, {
                params: { handle, from: 1, count }
            });
            if (response.data.status === 'OK') {
                return response.data.result;
            }
            return [];
        }
        catch (error) {
            console.error('Codeforces getUserSubmissions error:', error.message);
            return [];
        }
    }
    /**
     * Get solved problem count by topic
     */
    static async getTopicBreakdown(handle) {
        try {
            const submissions = await this.getUserSubmissions(handle, 500);
            const solvedProblems = new Set();
            const topicCounts = {};
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
        }
        catch (error) {
            console.error('Codeforces getTopicBreakdown error:', error.message);
            return {};
        }
    }
    /**
     * Verify bio token (user adds token to CF bio)
     */
    static async verifyBioToken(handle, token) {
        try {
            const response = await axios_1.default.get(`https://codeforces.com/profile/${handle}`);
            const html = response.data;
            // Simple check if token exists in the profile page
            return html.includes(token);
        }
        catch (error) {
            console.error('Codeforces verifyBioToken error:', error.message);
            return false;
        }
    }
    /**
     * Get daily submission counts for heatmap
     * Returns a map of date string -> submission count
     */
    static async getDailySubmissions(handle, days = 365) {
        try {
            const response = await axios_1.default.get(`${CF_API_BASE}/user.status`, {
                params: { handle, from: 1, count: 10000 }
            });
            if (response.data.status !== 'OK')
                return new Map();
            const submissions = response.data.result;
            const dailyCounts = new Map();
            const cutoffTime = Date.now() / 1000 - (days * 24 * 60 * 60);
            submissions.forEach((sub) => {
                if (sub.creationTimeSeconds < cutoffTime)
                    return;
                const date = new Date(sub.creationTimeSeconds * 1000);
                const dateStr = date.toISOString().split('T')[0];
                dailyCounts.set(dateStr, (dailyCounts.get(dateStr) || 0) + 1);
            });
            return dailyCounts;
        }
        catch (error) {
            console.error('Codeforces getDailySubmissions error:', error.message);
            return new Map();
        }
    }
}
exports.CodeforcesService = CodeforcesService;
