import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { emailId } = req.query;

  if (!emailId || typeof emailId !== "string") {
    return res.status(400).send("Invalid emailId");
  }

  try {
    // Marque l'email comme ouvert
    await supabaseAdmin
      .from("emails_sent")
      .update({ opened: true })
      .eq("id", emailId);

    // Retourne un pixel transparent
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgAClqw8AAAAASUVORK5CYII=",
      "base64"
    );
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(pixel);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
}