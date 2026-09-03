import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://isowiqscdkzlorkoqfur.supabase.co";
const supabasePublishableKey =
  "sb_publishable_bj2NmR_IlesfAsH0npigbQ_m9eHudtd";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
