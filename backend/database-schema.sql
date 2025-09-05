-- Database Schema for Player Auction System

-- Create Teams table
CREATE TABLE teams (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    budget INTEGER NOT NULL DEFAULT 1000,
    slots_left INTEGER NOT NULL DEFAULT 11,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Players table
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    position TEXT NOT NULL CHECK (position IN ('GK', 'Defender', 'Midfield', 'Striker', 'Girls')),
    base_price INTEGER NOT NULL DEFAULT 50000,
    played_last_year BOOLEAN DEFAULT FALSE,
    sold_price INTEGER,
    sold_to INTEGER REFERENCES teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Auction State table
CREATE TABLE auction_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    current_player_id INTEGER REFERENCES players(id),
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'paused', 'completed')),
    time_left INTEGER DEFAULT 30,
    bid_increment INTEGER DEFAULT 10000,
    current_bid INTEGER DEFAULT 0,
    current_bidder INTEGER REFERENCES teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_sold_to ON players(sold_to);
CREATE INDEX idx_players_name ON players(name);

-- Insert default auction state
INSERT INTO auction_state (id, status, time_left, bid_increment, current_bid)
VALUES (1, 'not_started', 30, 10000, 0)
ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auction_state_updated_at BEFORE UPDATE ON auction_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion (optional)
-- Insert sample teams
INSERT INTO teams (id, name, budget, slots_left) VALUES
(1, 'Team Alpha', 1000, 11),
(2, 'Team Beta', 1000, 11),
(3, 'Team Gamma', 1000, 11),
(4, 'Team Delta', 1000, 11),
(5, 'Team Echo', 1000, 11),
(6, 'Team Foxtrot', 1000, 11),
(7, 'Team Golf', 1000, 11),
(8, 'Team Hotel', 1000, 11),
(9, 'Team India', 1000, 11),
(10, 'Team Juliet', 1000, 11),
(11, 'Team Kilo (Girls)', 1000, 11),
(12, 'Team Lima (Girls)', 1000, 11)
ON CONFLICT (id) DO NOTHING;

-- Sample players (you can add more via CSV upload)
INSERT INTO players (name, year, position, base_price, played_last_year) VALUES
('John Smith', 2023, 'GK', 10, true),
('Mike Johnson', 2022, 'Defender', 80, false),
('Alex Brown', 2023, 'Midfield', 12, true),
('Chris Wilson', 2021, 'Striker', 150, true),
('Sarah Davis', 2023, 'Girls', 90, false),
('Emma Wilson', 2022, 'Girls', 120, true)
ON CONFLICT DO NOTHING;
