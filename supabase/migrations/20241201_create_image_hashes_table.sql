-- Create image_hashes table for duplicate detection
CREATE TABLE IF NOT EXISTS image_hashes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_hash VARCHAR(64) NOT NULL,
    connection_id VARCHAR(255) NOT NULL,
    reading_date DATE NOT NULL,
    image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('start', 'end')),
    storage_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for efficient duplicate checking
CREATE INDEX IF NOT EXISTS idx_image_hashes_file_hash ON image_hashes(file_hash);
CREATE INDEX IF NOT EXISTS idx_image_hashes_connection_id ON image_hashes(connection_id);
CREATE INDEX IF NOT EXISTS idx_image_hashes_reading_date ON image_hashes(reading_date);
CREATE INDEX IF NOT EXISTS idx_image_hashes_connection_hash ON image_hashes(connection_id, file_hash);

-- Create unique constraint to prevent exact duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_image_hashes_unique_duplicate 
ON image_hashes(connection_id, file_hash) 
WHERE file_hash IS NOT NULL;

-- Add RLS policies
ALTER TABLE image_hashes ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own data
CREATE POLICY "Users can view image hashes for their connections" ON image_hashes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM connections c 
            WHERE c.id = image_hashes.connection_id 
            AND c.user_id = auth.uid()
        )
    );

-- Policy for authenticated users to insert their own data
CREATE POLICY "Users can insert image hashes for their connections" ON image_hashes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM connections c 
            WHERE c.id = image_hashes.connection_id 
            AND c.user_id = auth.uid()
        )
    );

-- Policy for authenticated users to update their own data
CREATE POLICY "Users can update image hashes for their connections" ON image_hashes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM connections c 
            WHERE c.id = image_hashes.connection_id 
            AND c.user_id = auth.uid()
        )
    );

-- Policy for authenticated users to delete their own data
CREATE POLICY "Users can delete image hashes for their connections" ON image_hashes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM connections c 
            WHERE c.id = image_hashes.connection_id 
            AND c.user_id = auth.uid()
        )
    );
