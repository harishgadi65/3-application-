-- Seeds demo advertisements so the TV display's ad rotation has something to
-- show out of the box, without requiring a manual upload via the admin
-- dashboard first. Uses picsum.photos (deterministic per-seed placeholder
-- images) plus one public sample video, split evenly across the four real
-- on-screen positions (TOP/BOTTOM/LEFT/RIGHT) that AdZone.jsx/ScreenLayout.jsx
-- actually render.

INSERT INTO advertisements (title, media_url, media_type, position, is_active, display_order, created_at) VALUES
('Snake Game Sponsor',          'https://picsum.photos/seed/smartad-top-1/1600/300',    'IMAGE', 'TOP',    TRUE, 0, NOW()),
('Refreshing Cola Ad',          'https://picsum.photos/seed/smartad-top-2/1600/300',    'IMAGE', 'TOP',    TRUE, 1, NOW()),
('Tap Blast Energy Drink',      'https://picsum.photos/seed/smartad-bottom-1/1600/300', 'IMAGE', 'BOTTOM', TRUE, 0, NOW()),
('Local Pizza Deals',           'https://picsum.photos/seed/smartad-bottom-2/1600/300', 'IMAGE', 'BOTTOM', TRUE, 1, NOW()),
('Streaming Service Promo',     'https://picsum.photos/seed/smartad-left-1/300/900',    'IMAGE', 'LEFT',   TRUE, 0, NOW()),
('Sneaker Drop',                'https://picsum.photos/seed/smartad-left-2/300/900',    'IMAGE', 'LEFT',   TRUE, 1, NOW()),
('Mobile Game Teaser (Video)',  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'VIDEO', 'RIGHT', TRUE, 0, NOW()),
('Snack Brand Ad',              'https://picsum.photos/seed/smartad-right-2/300/900',   'IMAGE', 'RIGHT',  TRUE, 1, NOW());
