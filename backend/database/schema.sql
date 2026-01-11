-- Arc Platform Database Schema

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Nullable for OAuth users
  google_id VARCHAR(255) UNIQUE, -- For Google OAuth
  email_verified BOOLEAN DEFAULT FALSE, -- Track email verification
  profile_picture VARCHAR(500), -- Store Google profile picture URL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for Google OAuth lookups
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Platform handles (Codeforces, LeetCode)
CREATE TABLE platform_handles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('codeforces', 'leetcode')),
  handle VARCHAR(100) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(100),
  current_rating INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform)
);

-- Time-series snapshots (CRITICAL TABLE)
CREATE TABLE snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('codeforces', 'leetcode')),
  timestamp TIMESTAMP NOT NULL,
  rating INTEGER NOT NULL,
  total_solved INTEGER DEFAULT 0,
  topic_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform, timestamp)
);

-- Index for efficient time-range queries
CREATE INDEX idx_snapshots_user_platform_time 
ON snapshots(user_id, platform, timestamp DESC);

-- Partition by month for scalability (optional, can add later)
-- CREATE TABLE snapshots_2024_01 PARTITION OF snapshots
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Friend relationships (bidirectional storage)
CREATE TABLE friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id),
  CHECK(user_id != friend_id)
);

-- Index for friend lookups
CREATE INDEX idx_friends_user ON friends(user_id);
CREATE INDEX idx_friends_friend ON friends(friend_id);

-- Friend requests
CREATE TABLE friend_requests (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_id, receiver_id),
  CHECK(sender_id != receiver_id)
);

-- Normalized topics for topic mapping
CREATE TABLE topics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50)
);

-- Topic mappings (CF tags -> LC tags -> normalized topics)
CREATE TABLE topic_mappings (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('codeforces', 'leetcode')),
  platform_tag VARCHAR(100) NOT NULL,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  UNIQUE(platform, platform_tag)
);

-- Insert common topics
INSERT INTO topics (name, category) VALUES
  ('Dynamic Programming', 'algorithms'),
  ('Graphs', 'algorithms'),
  ('Trees', 'data_structures'),
  ('Arrays', 'data_structures'),
  ('Hash Tables', 'data_structures'),
  ('Strings', 'algorithms'),
  ('Math', 'algorithms'),
  ('Greedy', 'algorithms'),
  ('Binary Search', 'algorithms'),
  ('Two Pointers', 'algorithms'),
  ('Sliding Window', 'algorithms'),
  ('Backtracking', 'algorithms'),
  ('Bit Manipulation', 'algorithms'),
  ('Stacks', 'data_structures'),
  ('Queues', 'data_structures'),
  ('Heaps', 'data_structures'),
  ('Sorting', 'algorithms'),
  ('Recursion', 'algorithms'),
  ('Linked Lists', 'data_structures'),
  ('Tries', 'data_structures');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_handles_updated_at BEFORE UPDATE ON platform_handles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON friend_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
