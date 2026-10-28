// =====================================================
// PODESAVANJE - zameni vrednosti svojim podacima iz
// Supabase -> Project Settings -> API
// (anon key sme da bude javan, jer podatke stite RLS pravila)
// =====================================================
   const SUPABASE_URL = 'https://dsaeloirneuzkmekcaeg.supabase.co';
   const SUPABASE_ANON_KEY = 'sb_publishable__QFtg4wzmARgUQjldOyE3w_QGnaKEve';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
