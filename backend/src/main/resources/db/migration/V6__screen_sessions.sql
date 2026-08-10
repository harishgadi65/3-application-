-- Links a game session to the physical screen it was started from, so a
-- player scanning that screen's idle QR can be routed into the right
-- session, and the TV can find its own session instead of guessing from a
-- global "any active session" list.

ALTER TABLE game_sessions ADD COLUMN screen_id BIGINT NULL;
ALTER TABLE game_sessions ADD CONSTRAINT fk_game_sessions_screen FOREIGN KEY (screen_id) REFERENCES screens (id);
