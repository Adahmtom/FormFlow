// components/automations/AutomationsPanel.tsx
"use client";

import { useState } from "react";
import type { AutomationRule, AutomationType, FormField } from "@/types";

const uid = () => Math.random().toString(36).slice(2, 9);

const AUTO_TYPES: { type: AutomationType; icon: string; label: string; desc: string }[] = [
  { type: "email_notify", icon: "📧", label: "Email Notification", desc: "Send an email to admin when a response is submitted" },
  { type: "auto_reply",   icon: "↩️", label: "Auto-Reply",         desc: "Send a confirmation email back to the respondent" },
  { type: "webhook",      icon: "🔗", label: "Webhook",            desc: "POST response data to any external URL" },
  { type: "slack",        icon: "💬", label: "Slack Notification", desc: "Send a message to a Slack channel" },
];

export default function AutomationsPanel({
  automations,
  onChange,
  fields,
}: {
  automations: AutomationRule[];
  onChange: (rules: AutomationRule[]) => void;
  fields: FormField[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const emailFields = fields.filter(f => f.type === "email");

  const addRule = (type: AutomationType) => {
    const template = AUTO_TYPES.find(t => t.type === type)!;
    const rule: AutomationRule = {
      id: uid(),
      type,
      enabled: true,
      label: template.label,
      ...(type === "email_notify" ? { notifyEmail: "", notifySubject: "" } : {}),
      ...(type === "auto_reply"   ? { replyToField: emailFields[0]?.label ?? "", replySubject: "", replyBody: "" } : {}),
      ...(type === "webhook"      ? { webhookUrl: "", webhookMethod: "POST" } : {}),
      ...(type === "slack"        ? { slackWebhookUrl: "", slackMessage: "" } : {}),
    };
    const updated = [...automations, rule];
    onChange(updated);
    setOpenId(rule.id);
  };

  const updateRule = (id: string, patch: Partial<AutomationRule>) => {
    onChange(automations.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const removeRule = (id: string) => {
    onChange(automations.filter(r => r.id !== id));
    if (openId === id) setOpenId(null);
  };

  const inp: React.CSSProperties = { width: "100%", background: "#0e0e16", border: "1.5px solid #1e1e30", borderRadius: 8, color: "#F0EFF8", fontFamily: "Outfit,sans-serif", fontSize: 12, padding: "8px 11px", outline: "none" };
  const Label = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 5 }}>{children}</div>
  );

  return (
    <div>
      <div style={{ fontSize: 11, color: "#FF6B35", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 12 }}>Automations</div>

      {/* Add new */}
      <div style={{ marginBottom: 16 }}>
        <Label>Add Trigger</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {AUTO_TYPES.map(t => (
            <div
              key={t.type}
              onClick={() => addRule(t.type)}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", background: "#0b0b14", border: "1.5px solid #1a1a2c", borderRadius: 9, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#FF6B3560"; (e.currentTarget as HTMLElement).style.background = "#FF6B3508"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1a1a2c"; (e.currentTarget as HTMLElement).style.background = "#0b0b14"; }}
            >
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F0EFF8" }}>{t.label}</div>
                <div style={{ fontSize: 10, color: "#555" }}>{t.desc}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "#FF6B35", fontSize: 16 }}>+</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active rules */}
      {automations.length > 0 && (
        <div>
          <Label>Active Rules ({automations.length})</Label>
          {automations.map(rule => {
            const meta = AUTO_TYPES.find(t => t.type === rule.type)!;
            const isOpen = openId === rule.id;
            return (
              <div key={rule.id} style={{ background: "#0b0b14", border: `1.5px solid ${isOpen ? "#FF6B3550" : "#1a1a2c"}`, borderRadius: 10, marginBottom: 7, overflow: "hidden" }}>
                {/* Rule header */}
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", cursor: "pointer" }} onClick={() => setOpenId(isOpen ? null : rule.id)}>
                  <span style={{ fontSize: 16 }}>{meta.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{rule.label || meta.label}</div>
                    <div style={{ fontSize: 10, color: "#555" }}>{meta.desc}</div>
                  </div>
                  {/* Toggle enabled */}
                  <div
                    onClick={e => { e.stopPropagation(); updateRule(rule.id, { enabled: !rule.enabled }); }}
                    style={{ width: 36, height: 20, borderRadius: 10, background: rule.enabled ? "#FF6B35" : "#1e1e30", position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}
                  >
                    <div style={{ position: "absolute", top: 2, left: rule.enabled ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                  </div>
                  {/* Delete */}
                  <button onClick={e => { e.stopPropagation(); removeRule(rule.id); }} style={{ background: "rgba(239,68,68,.1)", color: "#f87171", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 12, cursor: "pointer", fontFamily: "Outfit,sans-serif" }}>✕</button>
                </div>

                {/* Rule config */}
                {isOpen && (
                  <div style={{ padding: "0 12px 14px", borderTop: "1px solid #1a1a2c", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <Label>Rule Label</Label>
                      <input style={inp} value={rule.label} onChange={e => updateRule(rule.id, { label: e.target.value })} placeholder="My automation label" />
                    </div>

                    {/* Email Notify fields */}
                    {rule.type === "email_notify" && <>
                      <div>
                        <Label>Notify Email</Label>
                        <input style={inp} type="email" value={rule.notifyEmail ?? ""} onChange={e => updateRule(rule.id, { notifyEmail: e.target.value })} placeholder="admin@yourcompany.com" />
                      </div>
                      <div>
                        <Label>Email Subject</Label>
                        <input style={inp} value={rule.notifySubject ?? ""} onChange={e => updateRule(rule.id, { notifySubject: e.target.value })} placeholder="New form response received" />
                      </div>
                    </>}

                    {/* Auto Reply fields */}
                    {rule.type === "auto_reply" && <>
                      <div>
                        <Label>Reply-To Field (email field in form)</Label>
                        <select style={inp} value={rule.replyToField ?? ""} onChange={e => updateRule(rule.id, { replyToField: e.target.value })}>
                          <option value="">Select email field…</option>
                          {emailFields.map(f => <option key={f.id} value={f.label}>{f.label}</option>)}
                        </select>
                        {emailFields.length === 0 && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 4 }}>⚠ Add an Email field to the form first</div>}
                      </div>
                      <div>
                        <Label>Subject</Label>
                        <input style={inp} value={rule.replySubject ?? ""} onChange={e => updateRule(rule.id, { replySubject: e.target.value })} placeholder="Thanks for your submission!" />
                      </div>
                      <div>
                        <Label>Message Body</Label>
                        <textarea style={{ ...inp, resize: "vertical" }} rows={4} value={rule.replyBody ?? ""} onChange={e => updateRule(rule.id, { replyBody: e.target.value })} placeholder="Thank you for contacting us. We'll be in touch shortly." />
                      </div>
                    </>}

                    {/* Webhook fields */}
                    {rule.type === "webhook" && <>
                      <div>
                        <Label>Webhook URL</Label>
                        <input style={inp} type="url" value={rule.webhookUrl ?? ""} onChange={e => updateRule(rule.id, { webhookUrl: e.target.value })} placeholder="https://your-app.com/webhook" />
                      </div>
                      <div>
                        <Label>Method</Label>
                        <select style={inp} value={rule.webhookMethod ?? "POST"} onChange={e => updateRule(rule.id, { webhookMethod: e.target.value as "POST" | "GET" })}>
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                        </select>
                      </div>
                      <div style={{ background: "#0a0a12", borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "#555", lineHeight: 1.6 }}>
                        Payload sent: <code style={{ color: "#FF9A5C" }}>{`{ event, form: { id, name }, response: { id, data, submitted_at } }`}</code>
                      </div>
                    </>}

                    {/* Slack fields */}
                    {rule.type === "slack" && <>
                      <div>
                        <Label>Slack Webhook URL</Label>
                        <input style={inp} type="url" value={rule.slackWebhookUrl ?? ""} onChange={e => updateRule(rule.id, { slackWebhookUrl: e.target.value })} placeholder="https://hooks.slack.com/services/…" />
                      </div>
                      <div>
                        <Label>Custom Message (optional)</Label>
                        <textarea style={{ ...inp, resize: "vertical" }} rows={3} value={rule.slackMessage ?? ""} onChange={e => updateRule(rule.id, { slackMessage: e.target.value })} placeholder="Leave blank to auto-generate from response data" />
                      </div>
                      <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>
                        Get a Slack webhook URL at <span style={{ color: "#00D4FF" }}>api.slack.com/messaging/webhooks</span>
                      </div>
                    </>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
