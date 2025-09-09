import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { emailId, url } = req.query;

  if (!emailId || typeof emailId !== "string" || !url || typeof url !== "string") {
    return res.status(400).send("Invalid parameters");
  }

  try {
    // Marque le clic
    await supabaseAdmin
      .from("emails_sent")
      .update({ clicked: true })
      .eq("id", emailId);

    // Redirige vers le lien réel
    res.redirect(url);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
}