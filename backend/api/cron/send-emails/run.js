import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function calculateNextDate(current, recurrence) {
  const d = new Date(current);
  switch (recurrence) {
    case "daily": d.setUTCDate(d.getUTCDate() + 1); break;
    case "weekly": d.setUTCDate(d.getUTCDate() + 7); break;
    case "monthly": d.setUTCMonth(d.getUTCMonth() + 1); break;
    case "yearly": d.setUTCFullYear(d.getUTCFullYear() + 1); break;
    default: return null;
  }
  return d.toISOString();
}

function buildTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { 
      user: process.env.FROM_EMAIL, 
      pass: process.env.EMAIL_PASS 
    },
  });
}

export async function GET() {
  try {
    const now = new Date().toISOString();

    // 1. Récupérer les séquences prêtes
    const { data: sequences, error: seqErr } = await supabaseAdmin
      .from("email_sequences")
      .select("*")
      .lte("scheduled_at", now)
      .eq("status", "pending");

    if (seqErr) throw new Error(seqErr.message);
    if (!sequences?.length) {
      return new Response(JSON.stringify({ sent: 0, info: "No sequences" }), { status: 200 });
    }

    const transporter = buildTransporter();
    let sentCount = 0;

    for (const sequence of sequences) {
      // 2. Récupérer les destinataires
      const { data: recipients, error: recErr } = await supabaseAdmin
        .from("sequence_recipients")
        .select("to_email")
        .eq("sequence_id", sequence.id);

      if (recErr) throw new Error(recErr.message);
      if (!recipients?.length) continue;

      for (const r of recipients) {
        // 3. Créer un enregistrement emails_sent AVANT d'envoyer
        const { data: inserted, error } = await supabaseAdmin
  .from("emails_sent")
  .insert({
    sequence_id: sequence.id,  // ID de la séquence envoyée
    to_email: recipient.to_email,
    opened: false,
    clicked: false,
    responded: false,
    variant: "A", // si A/B testing
  })
  .select()
  .single();

        if (insErr || !inserted) {
          console.error("⚠️ Insert error for", r.to_email, insErr?.message);
          continue;
        }

        // 4. Construire le mail avec pixel de tracking
const pixelUrl = `https://creamail.vercel.app/api/open?id=${inserted.id}`;
        const htmlBody = `${sequence.body}<br><img src="${pixelUrl}" width="1" height="1" />`;

        try {
          await transporter.sendMail({
            from: `"EchoNotes" <${process.env.FROM_EMAIL}>`,
            to: r.to_email,
            subject: sequence.subject,
            html: htmlBody,
          });
          sentCount++;
        } catch (e) {
          console.error("❌ Send error:", e.message);
        }
      }

      // 5. Reschedule / complete
      if (sequence.recurrence === "once") {
        await supabaseAdmin
          .from("email_sequences")
          .update({ status: "completed" })
          .eq("id", sequence.id);
      } else {
        const nextDate = calculateNextDate(sequence.scheduled_at, sequence.recurrence);
        if (nextDate) {
          await supabaseAdmin
            .from("email_sequences")
            .update({ scheduled_at: nextDate, status: "pending" })
            .eq("id", sequence.id);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: sentCount }), { status: 200 });
  } catch (err) {
    console.error("❌ Cron error:", err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
}