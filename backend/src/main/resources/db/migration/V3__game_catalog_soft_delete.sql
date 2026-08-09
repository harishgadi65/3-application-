-- Supports a "trash" view for the admin Games tab: deleting a catalog entry
-- marks it deleted_at instead of removing the row, so it can be restored or
-- permanently purged later.

ALTER TABLE available_games ADD COLUMN deleted_at DATETIME NULL;
