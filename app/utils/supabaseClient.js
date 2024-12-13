
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dhkymxhzgvczexamlaoy.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoa3lteGh6Z3ZjemV4YW1sYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1NDUyMDksImV4cCI6MjA0OTEyMTIwOX0.TDSvsFIgXXA173oINuyhOdnUnjeQAP9Tgt1uy4muBek"
export const supabase = createClient(supabaseUrl, supabaseKey)