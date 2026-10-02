const SUPABASE_URL = "https://yhlzrbbhyvjwexyhyaxk.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_NUPN8Cx1Tiv3265qot5CXQ_jxOk__m3";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                flowType: "pkce",
                detectSessionInUrl: false,
                persistSession: true,
                autoRefreshToken: true
            }
        }
    );