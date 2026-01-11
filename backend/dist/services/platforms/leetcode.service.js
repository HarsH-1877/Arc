"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeetCodeService = void 0;
const axios_1 = __importDefault(require("axios"));
const LC_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';
class LeetCodeService {
    /**
     * Get user profile
     */
    static async getUserProfile(username) {
        try {
            const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              ranking
              userAvatar
              realName
              aboutMe
            }
          }
        }
      `;
            const response = await axios_1.default.post(LC_GRAPHQL_ENDPOINT, {
                query,
                variables: { username }
            });
            if (response.data.data?.matchedUser) {
                return response.data.data.matchedUser;
            }
            return null;
        }
        catch (error) {
            console.error('LeetCode getUserProfile error:', error.message);
            return null;
        }
    }
    /**
     * Get user stats
     */
    static async getUserStats(username) {
        try {
            const query = `
        query getUserStats($username: String!) {
          matchedUser(username: $username) {
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
            profile {
              ranking
              userAvatar
              realName
            }
          }
          userContestRanking(username: $username) {
            rating
          }
        }
      `;
            const response = await axios_1.default.post(LC_GRAPHQL_ENDPOINT, {
                query,
                variables: { username }
            });
            const user = response.data.data?.matchedUser;
            if (!user)
                return null;
            const acSubmissions = user.submitStats.acSubmissionNum;
            const easySolved = acSubmissions.find((s) => s.difficulty === 'Easy')?.count || 0;
            const mediumSolved = acSubmissions.find((s) => s.difficulty === 'Medium')?.count || 0;
            const hardSolved = acSubmissions.find((s) => s.difficulty === 'Hard')?.count || 0;
            // Get contest rating (rounded to integer)
            const contestRating = response.data.data?.userContestRanking?.rating
                ? Math.round(response.data.data.userContestRanking.rating)
                : 0;
            return {
                totalSolved: easySolved + mediumSolved + hardSolved,
                easySolved,
                mediumSolved,
                hardSolved,
                ranking: contestRating // Now contains contest rating instead of global ranking
            };
        }
        catch (error) {
            console.error('LeetCode getUserStats error:', error.message);
            return null;
        }
    }
    /**
     * Get topic-wise progress
     */
    static async getTopicBreakdown(username) {
        try {
            const query = `
        query getUserTopics($username: String!) {
          matchedUser(username: $username) {
            tagProblemCounts {
              advanced {
                tagName
                tagSlug
                problemsSolved
              }
              intermediate {
                tagName
                tagSlug
                problemsSolved
              }
              fundamental {
                tagName
                tagSlug
                problemsSolved
              }
            }
          }
        }
      `;
            const response = await axios_1.default.post(LC_GRAPHQL_ENDPOINT, {
                query,
                variables: { username }
            });
            const tagCounts = response.data.data?.matchedUser?.tagProblemCounts;
            if (!tagCounts)
                return {};
            const topicBreakdown = {};
            // Combine all difficulty levels
            const allTopics = [
                ...(tagCounts.fundamental || []),
                ...(tagCounts.intermediate || []),
                ...(tagCounts.advanced || [])
            ];
            // Aggregate by topic name
            allTopics.forEach((topic) => {
                if (topic.problemsSolved > 0) {
                    topicBreakdown[topic.tagName] = (topicBreakdown[topic.tagName] || 0) + topic.problemsSolved;
                }
            });
            return topicBreakdown;
        }
        catch (error) {
            console.error('LeetCode getTopicBreakdown error:', error.message);
            return {};
        }
    }
    /**
     * Verify profile description contains token
     */
    static async verifyProfileToken(username, token) {
        try {
            const profile = await this.getUserProfile(username);
            if (!profile)
                return false;
            // Check if token exists in aboutMe
            return profile.profile.aboutMe?.includes(token) || false;
        }
        catch (error) {
            console.error('LeetCode verifyProfileToken error:', error.message);
            return false;
        }
    }
}
exports.LeetCodeService = LeetCodeService;
