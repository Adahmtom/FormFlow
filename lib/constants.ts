// lib/constants.ts
import type { FormTheme, FormCategory, FieldType } from "@/types";

export const DEFAULT_THEME: FormTheme = {
  bgColor: "#ffffff",
  bgType: "solid",
  bgGradient: "linear-gradient(135deg,#667eea,#764ba2)",
  formBg: "#ffffff",
  primaryColor: "#FF6B35",
  textColor: "#1a1a2e",
  labelColor: "#374151",
  inputBg: "#f9fafb",
  inputBorder: "#d1d5db",
  inputRadius: 8,
  fontFamily: "Outfit",
  fontSize: 15,
  labelSize: 14,
  titleSize: 28,
  formWidth: 680,
  formPadding: 40,
  formRadius: 16,
  fieldSpacing: 20,
  showShadow: true,
  buttonText: "Submit",
  buttonColor: "#FF6B35",
  buttonTextColor: "#ffffff",
  buttonRadius: 8,
  buttonFullWidth: true,
};

export const FORM_CATEGORIES: {
  id: FormCategory;
  label: string;
  color: string;
  bg: string;
  icon: string;
}[] = [
  { id: "job",     label: "Job Application", color: "#FF6B35", bg: "rgba(255,107,53,0.12)",  icon: "💼" },
  { id: "contact", label: "Contact / Lead",  color: "#00D4FF", bg: "rgba(0,212,255,0.10)",   icon: "📬" },
  { id: "survey",  label: "Survey",          color: "#C77DFF", bg: "rgba(199,125,255,0.10)", icon: "📊" },
];

export const FIELD_TYPES = [
  { type: "text",     icon: "Aa", label: "Short Text",    group: "basic"    },
  { type: "textarea", icon: "≡",  label: "Long Text",     group: "basic"    },
  { type: "email",    icon: "@",  label: "Email",         group: "basic"    },
  { type: "phone",    icon: "✆",  label: "Phone",         group: "basic"    },
  { type: "number",   icon: "#",  label: "Number",        group: "basic"    },
  { type: "date",     icon: "▦",  label: "Date",          group: "basic"    },
  { type: "select",   icon: "▾",  label: "Dropdown",      group: "choice"   },
  { type: "radio",    icon: "◉",  label: "Single Choice", group: "choice"   },
  { type: "checkbox", icon: "☑",  label: "Multi Choice",  group: "choice"   },
  { type: "rating",   icon: "★",  label: "Star Rating",   group: "advanced" },
  { type: "scale",    icon: "⇔",  label: "Linear Scale",  group: "advanced" },
  { type: "file",     icon: "↑",  label: "File Upload",   group: "advanced" },
  { type: "address",  icon: "📍", label: "Address",        group: "advanced" },
  { type: "section",  icon: "—",  label: "Section Break", group: "layout"   },
] as const;

export const GOOGLE_FONTS = [
  "Outfit","Poppins","Lato","Raleway","Nunito",
  "Playfair Display","Merriweather","DM Sans","Josefin Sans","Cormorant Garamond",
];

export const GRADIENT_PRESETS = [
  { label: "Purple Dream", value: "linear-gradient(135deg,#667eea,#764ba2)" },
  { label: "Pink Dusk",    value: "linear-gradient(135deg,#f093fb,#f5576c)" },
  { label: "Ocean",        value: "linear-gradient(135deg,#4facfe,#00f2fe)" },
  { label: "Mint",         value: "linear-gradient(135deg,#43e97b,#38f9d7)" },
  { label: "Sunset",       value: "linear-gradient(135deg,#fa709a,#fee140)" },
  { label: "Teal Sky",     value: "linear-gradient(135deg,#30cfd0,#667eea)" },
];

export const FORM_TEMPLATES: Record<FormCategory, { t: string; l: string; r: boolean; o?: string[] }[]> = {
  job: [
    { t:"text",    l:"Full Name",            r:true  },
    { t:"email",   l:"Email Address",        r:true  },
    { t:"phone",   l:"Phone Number",         r:false },
    { t:"text",    l:"Position Applied For", r:true  },
    { t:"select",  l:"Years of Experience",  r:true,  o:["0-2 years","3-5 years","6-10 years","10+ years"] },
    { t:"radio",   l:"Work Preference",      r:true,  o:["Remote","Hybrid","On-site"] },
    { t:"textarea",l:"Cover Letter",         r:false },
  ],
  contact: [
    { t:"text",    l:"Full Name",  r:true  },
    { t:"email",   l:"Email",      r:true  },
    { t:"phone",   l:"Phone",      r:false },
    { t:"text",    l:"Company",    r:false },
    { t:"select",  l:"Subject",    r:false, o:["General Enquiry","Support","Partnership","Other"] },
    { t:"textarea",l:"Message",    r:true  },
  ],
  survey: [
    { t:"rating",  l:"Overall Satisfaction",       r:true  },
    { t:"radio",   l:"How did you hear about us?",  r:false, o:["Social Media","Friend","Google","Email"] },
    { t:"scale",   l:"Recommendation Score",        r:true  },
    { t:"checkbox",l:"What features do you use?",   r:false, o:["Feature A","Feature B","Feature C","Feature D"] },
    { t:"textarea",l:"Additional Comments",         r:false },
  ],
};
