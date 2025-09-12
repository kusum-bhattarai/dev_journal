-- Users Table: Stores user authentication data
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  github_id VARCHAR(50),
  token VARCHAR(255)
);

-- Journal Entries Table: Stores private journal content per user
CREATE TABLE journal_entries (
  journal_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table: Stores chat messages with read status
CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT FALSE
);

-- Conversations Table: Manages unique chat threads between users
CREATE TABLE conversations (
    conversation_id SERIAL PRIMARY KEY,
    user1_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user2_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    last_message_id INTEGER REFERENCES messages(message_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Constraints for Conversations
ALTER TABLE conversations
ADD CONSTRAINT chk_user_order CHECK (user1_id < user2_id);

ALTER TABLE conversations
ADD CONSTRAINT unique_ordered_conversation_pair UNIQUE (user1_id, user2_id);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages (sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations (user1_id, user2_id);

-- Add conversation_id to Messages (if not already present)
ALTER TABLE messages ADD COLUMN conversation_id INTEGER REFERENCES conversations(conversation_id);

-- Update Existing Messages (run this only once in migration)
UPDATE messages
SET conversation_id = (
    SELECT conversation_id
    FROM conversations
    WHERE (user1_id = messages.sender_id AND user2_id = messages.receiver_id)
       OR (user1_id = messages.receiver_id AND user2_id = messages.sender_id)
)
WHERE conversation_id IS NULL;

ALTER TABLE messages ALTER COLUMN conversation_id SET NOT NULL;

CREATE TYPE permission_level AS ENUM ('viewer', 'editor');

-- Journal Collaborators Table: Manages user access to shared journals.
CREATE TABLE journal_collaborators (
  collaboration_id SERIAL PRIMARY KEY,
  journal_id INTEGER NOT NULL REFERENCES journal_entries(journal_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  permission permission_level NOT NULL,
  -- Ensure a user can only be a collaborator on a specific journal once.
  CONSTRAINT unique_journal_collaborator UNIQUE (journal_id, user_id)
);

-- Index for efficient lookup of a user's collaborations.
CREATE INDEX idx_journal_collaborators_user ON journal_collaborators(user_id);
