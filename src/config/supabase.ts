import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kzkpbxncyaddyfezonrt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6a3BieG5jeWFkZHlmZXpvbnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5Mjk1OTEsImV4cCI6MjA2OTUwNTU5MX0.giuF3dSd73izqo9N90UoYM13SA__MGEgHAYUC3oilRg';

export const supabase = createClient(supabaseUrl, supabaseKey);