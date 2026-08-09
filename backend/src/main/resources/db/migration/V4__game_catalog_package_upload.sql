-- Lets an admin attach a built game package (e.g. a zip bundle produced
-- outside this app) to a catalog entry from the Games tab. Storing the file
-- here is metadata only, same as icon_url - it does not wire the package
-- into gameplay; that still requires a matching GamePlugin implementation.

ALTER TABLE available_games ADD COLUMN package_url VARCHAR(512) NULL;
ALTER TABLE available_games ADD COLUMN package_filename VARCHAR(255) NULL;
