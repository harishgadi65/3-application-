-- Persists admin dashboard "Screens" (physical TV displays) to the backend
-- so a real TV device can look up its configuration by display code and
-- render that screen's assigned ads/games - previously this only existed
-- in the admin browser's local storage, which a separate TV device has no
-- way to read.

CREATE TABLE screen_groups (
    id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(128) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE screens (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    screen_no         INT          NOT NULL,
    display_code      VARCHAR(16)  NOT NULL,
    status            VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',
    special           BOOLEAN      NOT NULL DEFAULT FALSE,
    width             INT          NOT NULL DEFAULT 1920,
    height            INT          NOT NULL DEFAULT 1080,
    group_id          BIGINT       NULL,
    startup_ad_id     BIGINT       NULL,
    top_ad_id         BIGINT       NULL,
    bottom_ad_id      BIGINT       NULL,
    left_ad_id        BIGINT       NULL,
    right_ad_id       BIGINT       NULL,
    created_at        DATETIME     NOT NULL,
    CONSTRAINT uk_screens_display_code UNIQUE (display_code),
    CONSTRAINT uk_screens_screen_no UNIQUE (screen_no),
    CONSTRAINT fk_screens_group FOREIGN KEY (group_id) REFERENCES screen_groups (id),
    CONSTRAINT fk_screens_startup_ad FOREIGN KEY (startup_ad_id) REFERENCES advertisements (id),
    CONSTRAINT fk_screens_top_ad FOREIGN KEY (top_ad_id) REFERENCES advertisements (id),
    CONSTRAINT fk_screens_bottom_ad FOREIGN KEY (bottom_ad_id) REFERENCES advertisements (id),
    CONSTRAINT fk_screens_left_ad FOREIGN KEY (left_ad_id) REFERENCES advertisements (id),
    CONSTRAINT fk_screens_right_ad FOREIGN KEY (right_ad_id) REFERENCES advertisements (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE screen_games (
    screen_id  BIGINT      NOT NULL,
    game_type  VARCHAR(32) NOT NULL,
    CONSTRAINT fk_screen_games_screen FOREIGN KEY (screen_id) REFERENCES screens (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT INTO screen_groups (name) VALUES ('Area 1'), ('Area 2');
