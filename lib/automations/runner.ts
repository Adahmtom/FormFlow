// lib/automations/runner.ts
import type { AutomationRule, Form, Response } from "@/types";

interface RunAutomationsInput {
  form: Form;
  response: Response;
  supabase: any;
}

export async function runAutomations({ form, response, supabase }: RunAutomationsInput) {
  const rules = (form.automations ?? []).filter((r: AutomationRule) => r.enabled);
  if (rules.length === 0) return;

  for (const rule of rules) {
    try {
      await executeRule(rule, form, response);

      await supabase.from("automation_logs").insert({
        form_id: form.id,
        response_id: response.id,
        automation_type: rule.type,
        status: "success",
        payload: { rule },
      });
    } catch (err: any) {
      await supabase.from("automation_logs").insert({
        form_id: form.id,
        response_id: response.id,
        automation_type: rule.type,
        status: "failed",
        error: err.message,
        payload: { rule },
      });
    }
  }
}

async function executeRule(rule: AutomationRule, form: Form, response: Response) {
  switch (rule.type) {
    case "email_notify":
      await sendEmailNotification(rule, form, response);
      break;
    case "auto_reply":
      await sendAutoReply(rule, form, response);
      break;
    case "webhook":
      await triggerWebhook(rule, form, response);
      break;
    case "slack":
      await sendSlackNotification(rule, form, response);
      break;
  }
}

// ── Email notification to admin ──
async function sendEmailNotification(rule: AutomationRule, form: Form, response: Response) {
  if (!rule.notifyEmail) throw new Error("No notify email set");

  const body = buildEmailBody(form, response);

  // Uses Supabase Edge Function or your own SMTP
  // Replace with your email provider (Resend, SendGrid, etc.)
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: rule.notifyEmail,
      subject: rule.notifySubject || `New response: ${form.name}`,
      html: body,
    }),
  });

  if (!res.ok) throw new Error(`Email failed: ${res.statusText}`);
}

// ── Auto-reply to respondent ──
async function sendAutoReply(rule: AutomationRule, form: Form, response: Response) {
  if (!rule.replyToField) throw new Error("No reply-to field set");

  const respondentEmail = response.data[rule.replyToField] as string;
  if (!respondentEmail || !respondentEmail.includes("@")) {
    throw new Error("No valid email found in response data");
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      to: respondentEmail,
      subject: rule.replySubject || `Thanks for submitting ${form.name}`,
      html: rule.replyBody
        ? `<p>${rule.replyBody.replace(/\n/g, "<br>")}</p>`
        : `<p>Thank you for your submission. We'll be in touch shortly.</p>`,
    }),
  });

  if (!res.ok) throw new Error(`Auto-reply failed: ${res.statusText}`);
}

// ── Webhook ──
async function triggerWebhook(rule: AutomationRule, form: Form, response: Response) {
  if (!rule.webhookUrl) throw new Error("No webhook URL set");

  const payload = {
    event: "form.response",
    form: { id: form.id, name: form.name, category: form.category },
    response: { id: response.id, submitted_at: response.submitted_at, data: response.data },
  };

  const res = await fetch(rule.webhookUrl, {
    method: rule.webhookMethod || "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Webhook failed: ${res.status} ${res.statusText}`);
}

// ── Slack ──
async function sendSlackNotification(rule: AutomationRule, form: Form, response: Response) {
  if (!rule.slackWebhookUrl) throw new Error("No Slack webhook URL set");

  const fields = Object.entries(response.data)
    .map(([k, v]) => `*${k}:* ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("\n");

  const text = rule.slackMessage
    ? rule.slackMessage
    : `📋 *New response on "${form.name}"*\n\n${fields}`;

  const res = await fetch(rule.slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error(`Slack failed: ${res.statusText}`);
}

// ── Helpers ──
function buildEmailBody(form: Form, response: Response): string {
  const rows = Object.entries(response.data)
    .map(([k, v]) => `<tr><td style="padding:8px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">${k}</td><td style="padding:8px;color:#111827;border-bottom:1px solid #e5e7eb">${Array.isArray(v) ? v.join(", ") : v || "—"}</td></tr>`)
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#FF6B35">New response: ${form.name}</h2>
      <p style="color:#6b7280">Submitted ${new Date(response.submitted_at).toLocaleString()}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">${rows}</table>
    </div>
  `;
}
