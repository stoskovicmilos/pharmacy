// supabase.js
// Povezivanje sa Supabase backend-om

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
let SUPABASE_URL = 'https://your-project.supabase.co';
let SUPABASE_ANON_KEY = 'your-anon-key';

try {
	const cfg = await import('./supabase.config.js');
	SUPABASE_URL = cfg.SUPABASE_URL || SUPABASE_URL;
	SUPABASE_ANON_KEY = cfg.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
} catch (err) {
	console.warn('supabase.config.js not found — using placeholder values. Create supabase.config.js from supabase.config.example.js and do not commit it.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

