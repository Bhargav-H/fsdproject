import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ehfmfqsvidoelfcmlfkn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoZm1mcXN2aWRvZWxmY21sZmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyODg0OTYsImV4cCI6MjA2Mjg2NDQ5Nn0.6szyoVzJqUh7tGoFl8zjUfcGiXY-pq7PsK_wXFnN8-w";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
