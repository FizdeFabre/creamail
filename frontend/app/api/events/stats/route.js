import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No token provided" }), { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const supabase = createRouteHandlerClient({ headers: { authorization: authHeader } });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", detail: userError ?? "User not found" }),
        { status: 401 }
      );
    }

    const userId = user.id;

    const { data: sequencesData, error: seqError } = await supabase
      .from("email_sequences")
      .select("id, campaign_name")
      .eq("user_id", userId);
    if (seqError) throw seqError;

    const sequenceIds = sequencesData.map(s => s.id);
    if (sequenceIds.length === 0) {
      return new Response(JSON.stringify({ totalSent: 0, totalOpened: 0, variants: [] }), { status: 200 });
    }

    const { data: sendsData, error: sendsError } = await supabase
      .from("emails_sent")
      .select("id, sent_at, opened, variant, sequence_id")
      .in("sequence_id", sequenceIds);
    if (sendsError) throw sendsError;

    const sends = sendsData ?? [];
    const totalSent = sends.length;
    const totalOpened = sends.filter(e => e.opened).length;
    const openRate = totalSent ? (totalOpened / totalSent) * 100 : 0;

    const variants = {};
    sends.forEach(e => {
      const v = e.variant || "A";
      if (!variants[v]) variants[v] = { totalSent: 0, totalOpened: 0 };
      variants[v].totalSent++;
      if (e.opened) variants[v].totalOpened++;
    });

    const variantStats = Object.entries(variants).map(([variant, s]) => ({
      variant,
      totalSent: s.totalSent,
      totalOpened: s.totalOpened,
      openRate: s.totalSent ? (s.totalOpened / s.totalSent) * 100 : 0
    }));

    return new Response(JSON.stringify({ totalSent, totalOpened, openRate, variants: variantStats }), { status: 200 });

  } catch (err) {
    console.error("Stats API error:", err);

    // ✅ transforme l'erreur en string lisible pour JSON
    const detail = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err));

    return new Response(
      JSON.stringify({ error: "Internal server error", detail }),
      { status: 500 }
    );
  }
}