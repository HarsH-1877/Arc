export interface CodeforcesUserInfo {
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  contribution?: number;
  friendOfCount?: number;
  titlePhoto?: string;
  handle: string;
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
  contestId?: number;
  problem: {
    name: string;
    index: string;
    tags: string[];
  };
  verdict: string;
  programmingLanguage: string;
  creationTimeSeconds: number;
}

export interface CodeforcesApiResponse<T> {
  status: 'OK' | 'FAILED';
  comment?: string;
  result?: T;
}
