import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No token sent" }), { status: 401 });
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>
  const supabase = createRouteHandlerClient({ headers: { authorization: authHeader } });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized", detail: error }), { status: 401 });
  }

  return new Response(JSON.stringify({ success: true, userId: user.id }));
}