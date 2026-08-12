-- Screens now play a rotating playlist of ads per slot (starting screen +
-- 4 edges) instead of a single fixed ad. Replaces the single *_ad_id
-- columns on `screens` with an ordered junction table.

CREATE TABLE screen_ad_assignments (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    screen_id         BIGINT       NOT NULL,
    position          VARCHAR(16)  NOT NULL,
    advertisement_id  BIGINT       NOT NULL,
    display_order     INT          NOT NULL DEFAULT 0,
    created_at        DATETIME     NOT NULL,
    CONSTRAINT fk_saa_screen FOREIGN KEY (screen_id) REFERENCES screens (id) ON DELETE CASCADE,
    CONSTRAINT fk_saa_ad FOREIGN KEY (advertisement_id) REFERENCES advertisements (id) ON DELETE CASCADE,
    CONSTRAINT uk_saa_screen_position_ad UNIQUE (screen_id, position, advertisement_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT INTO screen_ad_assignments (screen_id, position, advertisement_id, display_order, created_at)
SELECT id, 'STARTUP', startup_ad_id, 0, NOW() FROM screens WHERE startup_ad_id IS NOT NULL;
INSERT INTO screen_ad_assignments (screen_id, position, advertisement_id, display_order, created_at)
SELECT id, 'TOP', top_ad_id, 0, NOW() FROM screens WHERE top_ad_id IS NOT NULL;
INSERT INTO screen_ad_assignments (screen_id, position, advertisement_id, display_order, created_at)
SELECT id, 'BOTTOM', bottom_ad_id, 0, NOW() FROM screens WHERE bottom_ad_id IS NOT NULL;
INSERT INTO screen_ad_assignments (screen_id, position, advertisement_id, display_order, created_at)
SELECT id, 'LEFT', left_ad_id, 0, NOW() FROM screens WHERE left_ad_id IS NOT NULL;
INSERT INTO screen_ad_assignments (screen_id, position, advertisement_id, display_order, created_at)
SELECT id, 'RIGHT', right_ad_id, 0, NOW() FROM screens WHERE right_ad_id IS NOT NULL;

ALTER TABLE screens
    DROP FOREIGN KEY fk_screens_startup_ad,
    DROP FOREIGN KEY fk_screens_top_ad,
    DROP FOREIGN KEY fk_screens_bottom_ad,
    DROP FOREIGN KEY fk_screens_left_ad,
    DROP FOREIGN KEY fk_screens_right_ad,
    DROP COLUMN startup_ad_id,
    DROP COLUMN top_ad_id,
    DROP COLUMN bottom_ad_id,
    DROP COLUMN left_ad_id,
    DROP COLUMN right_ad_id;
