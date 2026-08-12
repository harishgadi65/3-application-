-- Coupons: sponsor rewards (code + discount, optional image) shown to
-- players. Each coupon is assigned to a game type on one or more screens via
-- `coupon_assignments`, the same junction-table shape as `screen_ad_assignments`.

CREATE TABLE coupons (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    title                 VARCHAR(255) NOT NULL,
    client_name           VARCHAR(255) NULL,
    code                  VARCHAR(64)  NOT NULL,
    discount_description  VARCHAR(255) NOT NULL,
    image_url             VARCHAR(512) NULL,
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            DATETIME     NOT NULL,
    deleted_at            DATETIME     NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE coupon_assignments (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    screen_id      BIGINT      NOT NULL,
    game_type      VARCHAR(32) NOT NULL,
    coupon_id      BIGINT      NOT NULL,
    display_order  INT         NOT NULL DEFAULT 0,
    created_at     DATETIME    NOT NULL,
    CONSTRAINT fk_ca_screen FOREIGN KEY (screen_id) REFERENCES screens (id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE CASCADE,
    CONSTRAINT uk_ca_screen_game_coupon UNIQUE (screen_id, game_type, coupon_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
