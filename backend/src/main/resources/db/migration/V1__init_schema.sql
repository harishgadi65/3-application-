-- Smart Interactive Advertising & Gaming Platform - initial schema

CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(64)  NOT NULL,
    email         VARCHAR(128) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(128) NOT NULL,
    avatar_url    VARCHAR(512) NULL,
    created_at    DATETIME     NOT NULL,
    updated_at    DATETIME     NOT NULL,
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE admins (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(64)  NOT NULL,
    email         VARCHAR(128) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    DATETIME     NOT NULL,
    CONSTRAINT uk_admins_username UNIQUE (username),
    CONSTRAINT uk_admins_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE game_sessions (
    id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_code           VARCHAR(8)   NOT NULL,
    admin_id               BIGINT       NOT NULL,
    status                 VARCHAR(32)  NOT NULL,
    game_type              VARCHAR(32)  NOT NULL,
    max_players            INT          NOT NULL,
    game_duration_seconds  INT          NOT NULL,
    qr_code_url            VARCHAR(512) NULL,
    game_config_json       TEXT         NULL,
    started_at             DATETIME     NULL,
    ended_at               DATETIME     NULL,
    created_at             DATETIME     NOT NULL,
    updated_at             DATETIME     NOT NULL,
    CONSTRAINT uk_game_sessions_code UNIQUE (session_code),
    CONSTRAINT fk_game_sessions_admin FOREIGN KEY (admin_id) REFERENCES admins (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE player_sessions (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT      NOT NULL,
    session_id   BIGINT      NOT NULL,
    status       VARCHAR(32) NOT NULL,
    final_score  INT         NULL,
    final_rank   INT         NULL,
    stats_json   TEXT        NULL,
    joined_at    DATETIME    NOT NULL,
    left_at      DATETIME    NULL,
    CONSTRAINT fk_player_sessions_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_player_sessions_session FOREIGN KEY (session_id) REFERENCES game_sessions (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_player_sessions_session ON player_sessions (session_id);
CREATE INDEX idx_player_sessions_user ON player_sessions (user_id);

CREATE TABLE game_scores (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    player_session_id   BIGINT      NOT NULL,
    session_id          BIGINT      NOT NULL,
    score               INT         NOT NULL,
    event_type          VARCHAR(64) NOT NULL,
    event_data_json     TEXT        NULL,
    recorded_at         DATETIME    NOT NULL,
    CONSTRAINT fk_game_scores_player_session FOREIGN KEY (player_session_id) REFERENCES player_sessions (id),
    CONSTRAINT fk_game_scores_session FOREIGN KEY (session_id) REFERENCES game_sessions (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_game_scores_session ON game_scores (session_id);

CREATE TABLE game_history (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id        BIGINT      NOT NULL,
    winner_user_id    BIGINT      NULL,
    game_type         VARCHAR(32) NOT NULL,
    total_players     INT         NOT NULL,
    duration_seconds  INT         NOT NULL,
    summary_json      TEXT        NULL,
    completed_at      DATETIME    NOT NULL,
    CONSTRAINT fk_game_history_session FOREIGN KEY (session_id) REFERENCES game_sessions (id),
    CONSTRAINT fk_game_history_winner FOREIGN KEY (winner_user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE advertisements (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    title          VARCHAR(255) NOT NULL,
    media_url      VARCHAR(512) NOT NULL,
    media_type     VARCHAR(16)  NOT NULL,
    position       VARCHAR(32)  NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order  INT          NOT NULL DEFAULT 0,
    created_at     DATETIME     NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_advertisements_active_order ON advertisements (is_active, display_order);

CREATE TABLE available_games (
    game_type                   VARCHAR(32)  NOT NULL PRIMARY KEY,
    display_name                VARCHAR(128) NOT NULL,
    description                 VARCHAR(512) NULL,
    icon_url                    VARCHAR(512) NULL,
    default_max_players         INT          NOT NULL,
    default_duration_seconds    INT          NOT NULL,
    is_active                   BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT INTO available_games (game_type, display_name, description, icon_url, default_max_players, default_duration_seconds, is_active)
VALUES
    ('SNAKE', 'Snake', 'Multiplayer snake on a shared grid - eat food, avoid walls and other snakes, last one alive wins.', NULL, 8, 120, TRUE),
    ('TAP_BLAST', 'Tap Blast Race', 'Mash the button to fill your rocket''s launch bar and react fast to BOOST/TRAP events - first to launch wins.', NULL, 16, 60, TRUE);

-- Demo admin account: username=admin, password=admin123 (BCrypt-hashed)
INSERT INTO admins (username, email, password_hash, created_at)
VALUES ('admin', 'admin@smartad.local', '$2b$10$4FvHz.r28RkyrSFp.QWRLeWT5CP7AzVz/YwAjzPpr6q0b8vVC0Rny', NOW());
