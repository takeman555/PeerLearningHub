-- Create exec_sql RPC function for database setup scripts
-- This function allows scripts to execute arbitrary SQL commands

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN 'SQL executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;

-- Create migrations tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public._migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions on migrations table
GRANT ALL ON TABLE public._migrations TO authenticated;
GRANT ALL ON TABLE public._migrations TO anon;
GRANT USAGE, SELECT ON SEQUENCE public._migrations_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public._migrations_id_seq TO anon;