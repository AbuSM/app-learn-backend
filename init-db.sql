-- Initial Database Setup Script
-- This script runs automatically when PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create basic indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_boards_workspace ON boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_boards_is_active ON boards(is_active);

CREATE INDEX IF NOT EXISTS idx_lists_board ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_lists_is_active ON lists(is_active);

CREATE INDEX IF NOT EXISTS idx_cards_list ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_cards_created_by ON cards(created_by_id);
CREATE INDEX IF NOT EXISTS idx_cards_is_active ON cards(is_active);

CREATE INDEX IF NOT EXISTS idx_comments_card ON card_comments(card_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON card_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_workspaces_is_active ON workspaces(is_active);

CREATE INDEX IF NOT EXISTS idx_calendar_events_workspace ON calendar_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_is_active ON calendar_events(is_active);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE app_learn_db TO app_learn_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO app_learn_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_learn_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_learn_user;

-- Set user as owner of sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_learn_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_learn_user;
