-- Enable PostGIS extension for geometry types
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create the land_parcels table
CREATE TABLE IF NOT EXISTS land_parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_number TEXT NOT NULL,
    village_name TEXT DEFAULT 'Shela',
    owner_name TEXT NOT NULL,
    tenure_type TEXT CHECK (tenure_type IN ('Old Tenure', 'New Tenure', 'Govt Land')),
    is_litigated BOOLEAN DEFAULT false,
    zone_type TEXT CHECK (zone_type IN ('R1', 'R2', 'Agriculture')),
    road_width FLOAT,
    polygon_geom GEOMETRY(Polygon, 4326) -- SRID 4326 for WGS 84 (Lng, Lat)
);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_land_parcels_geom ON land_parcels USING GIST (polygon_geom);
