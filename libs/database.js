import config from "../config.json" assert { type: 'json' }
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient(config.database.url, config.database.anon_key)

export { supabase }