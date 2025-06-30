import { supabase } from "./supabaseClient";

export async function getSequences() {
    const { data, error } = await supabase.from("sequences").select("*");
    if (error) throw error;
    return data;
}