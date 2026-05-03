-- SQL to enable Row Level Security on your 'models' table in Supabase
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- 2. Create policy: Users can only see their own models
CREATE POLICY "Users see own models" 
ON models 
FOR ALL 
USING (auth.uid() = user_id);

-- 3. Create policy: Authenticated users can insert their own models
CREATE POLICY "Users can insert own models"
ON models
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Create policy: Users can update their own models
CREATE POLICY "Users can update own models"
ON models
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Create policy: Users can delete their own models
CREATE POLICY "Users can delete own models"
ON models
FOR DELETE
USING (auth.uid() = user_id);
