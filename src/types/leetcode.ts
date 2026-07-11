export interface LeetcodeUserProfile {
  username: string;
  profile: {
    userAvatar: string;
    ranking: number;
    reputation: number;
  } | null;
}

export interface LeetcodeSolvedStats {
  acSubmissionNum: Array<{
    difficulty: string;
    count: number;
  }>;
  totalSubmissionNum: Array<{
    difficulty: string;
    count: number;
  }>;
}

export interface LeetcodeContestRanking {
  attendedContestsCount: number;
  rating: number;
  globalRanking: number;
  topPercentage: number;
}

export interface LeetcodeRecentSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

export interface LeetcodeTagStat {
  tagName: string;
  problemsSolved: number;
}
