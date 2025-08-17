"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServerClient = createServerClient;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
function createServerClient(useServiceRole = false) {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
    }
    const key = useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY
        ? process.env.SUPABASE_SERVICE_ROLE_KEY
        : supabaseAnonKey;
    return (0, supabase_js_1.createClient)(supabaseUrl, key);
}
//# sourceMappingURL=supabase-server.js.map