-- Explore Bingo Map - Application Tables
-- Note: Auth tables (user, session, account, verification) are managed by BetterAuth CLI

-- Places table - locations that users check into
CREATE TABLE IF NOT EXISTS place (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    external_place_id VARCHAR(255), -- For Google Places API or similar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for geospatial queries (basic)
CREATE INDEX IF NOT EXISTS idx_place_location ON place(lat, lng);
CREATE INDEX IF NOT EXISTS idx_place_external_id ON place(external_place_id);

-- Check-ins table - user experiences at places
CREATE TABLE IF NOT EXISTS check_in (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES place(id) ON DELETE CASCADE,
    note TEXT,
    photo_url TEXT,
    happy_tags TEXT[] NOT NULL DEFAULT '{}', -- Array of happy tag values
    cautions TEXT[] DEFAULT '{}', -- Array of caution tag values
    contexts TEXT[] DEFAULT '{}', -- Array of context tag values
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure at least one happy tag (enforced at application level)
    -- Ensure either note or photo_url is provided (enforced at application level)
    CONSTRAINT check_in_has_content CHECK (note IS NOT NULL OR photo_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_check_in_user ON check_in(user_id);
CREATE INDEX IF NOT EXISTS idx_check_in_place ON check_in(place_id);
CREATE INDEX IF NOT EXISTS idx_check_in_created ON check_in(created_at DESC);

-- Bingo cards table - weekly task card themes
CREATE TABLE IF NOT EXISTS bingo_card (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme VARCHAR(255) NOT NULL,
    week_start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bingo_card_week ON bingo_card(week_start_date);

-- Bingo tasks table - 25 tasks per card (5x5 grid)
CREATE TABLE IF NOT EXISTS bingo_task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bingo_card_id UUID NOT NULL REFERENCES bingo_card(id) ON DELETE CASCADE,
    task_index SMALLINT NOT NULL CHECK (task_index >= 0 AND task_index <= 24),
    title VARCHAR(255) NOT NULL,
    rule TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique index per card
    UNIQUE (bingo_card_id, task_index)
);

CREATE INDEX IF NOT EXISTS idx_bingo_task_card ON bingo_task(bingo_card_id);

-- Bingo completions table - links user task completions to check-ins
CREATE TABLE IF NOT EXISTS bingo_completion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    bingo_task_id UUID NOT NULL REFERENCES bingo_task(id) ON DELETE CASCADE,
    check_in_id UUID NOT NULL REFERENCES check_in(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One completion per user per task
    UNIQUE (user_id, bingo_task_id)
);

CREATE INDEX IF NOT EXISTS idx_bingo_completion_user ON bingo_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_bingo_completion_task ON bingo_completion(bingo_task_id);

-- Rooms table - multiplayer rooms with unique codes
CREATE TABLE IF NOT EXISTS room (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) NOT NULL UNIQUE, -- 6-char alphanumeric code
    bingo_card_id UUID NOT NULL REFERENCES bingo_card(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_code ON room(code);

-- Room members table - tracks room membership
CREATE TABLE IF NOT EXISTS room_member (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES room(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One membership per user per room
    UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_member_room ON room_member(room_id);
CREATE INDEX IF NOT EXISTS idx_room_member_user ON room_member(user_id);
