// types/index.ts

export type UserRole = "admin" | "editor" | "viewer" | "responder";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  invited_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FormCategory = "job" | "contact" | "survey";

export type FieldType =
  | "text" | "textarea" | "email" | "phone" | "number" | "date"
  | "select" | "radio" | "checkbox" | "rating" | "scale" | "file" | "section"
  | "address";

// ── Conditional Logic ──
export type ConditionOperator = "equals" | "not_equals" | "contains" | "not_empty" | "is_empty";

export interface FieldCondition {
  enabled: boolean;
  sourceFieldId: string;   // which field to watch
  operator: ConditionOperator;
  value: string;           // the value to compare against
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
  defaultCountry?: string;
  condition?: FieldCondition;     // conditional show/hide
  maxFileSize?: number;           // in MB, for file fields
  allowedFileTypes?: string[];    // e.g. [".pdf",".jpg",".png"]
}

export interface FormTheme {
  bgColor: string;
  bgType: "solid" | "gradient";
  bgGradient: string;
  formBg: string;
  primaryColor: string;
  textColor: string;
  labelColor: string;
  inputBg: string;
  inputBorder: string;
  inputRadius: number;
  fontFamily: string;
  fontSize: number;
  labelSize: number;
  titleSize: number;
  formWidth: number;
  formPadding: number;
  formRadius: number;
  fieldSpacing: number;
  showShadow: boolean;
  buttonText: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonRadius: number;
  buttonFullWidth: boolean;
}

export type AutomationType = "email_notify" | "auto_reply" | "webhook" | "slack";

export interface AutomationRule {
  id: string;
  type: AutomationType;
  enabled: boolean;
  label: string;
  notifyEmail?: string;
  notifySubject?: string;
  replyToField?: string;
  replySubject?: string;
  replyBody?: string;
  webhookUrl?: string;
  webhookMethod?: "POST" | "GET";
  slackWebhookUrl?: string;
  slackMessage?: string;
}

export interface Form {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: FormCategory;
  fields: FormField[];
  theme: FormTheme;
  automations: AutomationRule[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Response {
  id: string;
  form_id: string;
  data: Record<string, string | string[]>;
  submitted_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AutomationLog {
  id: string;
  form_id: string;
  response_id: string;
  automation_type: AutomationType;
  status: "pending" | "success" | "failed";
  payload?: Record<string, any>;
  error?: string;
  created_at: string;
}

export type ShareMode = "link" | "embed" | "display";
export type BuilderPanel = "fields" | "theme" | "share" | "automate";
