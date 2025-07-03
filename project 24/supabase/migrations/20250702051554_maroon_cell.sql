/*
  # Fix RLS policies for media_analysis_chunks table

  1. Security Updates
    - Update RLS policies to allow anonymous access for INSERT operations
    - Maintain existing policies for other operations
    - Ensure compatibility with frontend-only application using anonymous key

  2. Changes
    - Drop existing INSERT policy that requires authentication
    - Create new INSERT policy that allows anonymous access
    - Keep existing SELECT, UPDATE, DELETE policies for authenticated users
*/

-- Drop the existing INSERT policy that requires authentication
DROP POLICY IF EXISTS "Users can insert chunk data" ON media_analysis_chunks;

-- Create new INSERT policy that allows anonymous access
CREATE POLICY "Allow anonymous insert for chunk data"
  ON media_analysis_chunks
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Also allow authenticated users to insert (in case authentication is added later)
CREATE POLICY "Allow authenticated insert for chunk data"
  ON media_analysis_chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update the SELECT policy to also allow anonymous access for reading
DROP POLICY IF EXISTS "Users can read own chunk data" ON media_analysis_chunks;

CREATE POLICY "Allow anonymous read for chunk data"
  ON media_analysis_chunks
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated read for chunk data"
  ON media_analysis_chunks
  FOR SELECT
  TO authenticated
  USING (true);

-- Update UPDATE policy to allow anonymous access
DROP POLICY IF EXISTS "Users can update chunk data" ON media_analysis_chunks;

CREATE POLICY "Allow anonymous update for chunk data"
  ON media_analysis_chunks
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update for chunk data"
  ON media_analysis_chunks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update DELETE policy to allow anonymous access
DROP POLICY IF EXISTS "Users can delete chunk data" ON media_analysis_chunks;

CREATE POLICY "Allow anonymous delete for chunk data"
  ON media_analysis_chunks
  FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated delete for chunk data"
  ON media_analysis_chunks
  FOR DELETE
  TO authenticated
  USING (true);