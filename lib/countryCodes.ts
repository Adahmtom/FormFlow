// lib/countryCodes.ts
export interface CountryCode {
  name: string;
  code: string;   // ISO alpha-2
  dial: string;   // e.g. "+1"
  flag: string;   // emoji flag
}

export const COUNTRY_CODES: CountryCode[] = [
  { name:"United States",       code:"US", dial:"+1",   flag:"🇺🇸" },
  { name:"Canada",              code:"CA", dial:"+1",   flag:"🇨🇦" },
  { name:"United Kingdom",      code:"GB", dial:"+44",  flag:"🇬🇧" },
  { name:"Australia",           code:"AU", dial:"+61",  flag:"🇦🇺" },
  { name:"Nigeria",             code:"NG", dial:"+234", flag:"🇳🇬" },
  { name:"Ghana",               code:"GH", dial:"+233", flag:"🇬🇭" },
  { name:"South Africa",        code:"ZA", dial:"+27",  flag:"🇿🇦" },
  { name:"Kenya",               code:"KE", dial:"+254", flag:"🇰🇪" },
  { name:"India",               code:"IN", dial:"+91",  flag:"🇮🇳" },
  { name:"Pakistan",            code:"PK", dial:"+92",  flag:"🇵🇰" },
  { name:"Bangladesh",          code:"BD", dial:"+880", flag:"🇧🇩" },
  { name:"Germany",             code:"DE", dial:"+49",  flag:"🇩🇪" },
  { name:"France",              code:"FR", dial:"+33",  flag:"🇫🇷" },
  { name:"Italy",               code:"IT", dial:"+39",  flag:"🇮🇹" },
  { name:"Spain",               code:"ES", dial:"+34",  flag:"🇪🇸" },
  { name:"Netherlands",         code:"NL", dial:"+31",  flag:"🇳🇱" },
  { name:"Portugal",            code:"PT", dial:"+351", flag:"🇵🇹" },
  { name:"Sweden",              code:"SE", dial:"+46",  flag:"🇸🇪" },
  { name:"Norway",              code:"NO", dial:"+47",  flag:"🇳🇴" },
  { name:"Denmark",             code:"DK", dial:"+45",  flag:"🇩🇰" },
  { name:"Finland",             code:"FI", dial:"+358", flag:"🇫🇮" },
  { name:"Poland",              code:"PL", dial:"+48",  flag:"🇵🇱" },
  { name:"Brazil",              code:"BR", dial:"+55",  flag:"🇧🇷" },
  { name:"Mexico",              code:"MX", dial:"+52",  flag:"🇲🇽" },
  { name:"Argentina",           code:"AR", dial:"+54",  flag:"🇦🇷" },
  { name:"Colombia",            code:"CO", dial:"+57",  flag:"🇨🇴" },
  { name:"Chile",               code:"CL", dial:"+56",  flag:"🇨🇱" },
  { name:"China",               code:"CN", dial:"+86",  flag:"🇨🇳" },
  { name:"Japan",               code:"JP", dial:"+81",  flag:"🇯🇵" },
  { name:"South Korea",         code:"KR", dial:"+82",  flag:"🇰🇷" },
  { name:"Indonesia",           code:"ID", dial:"+62",  flag:"🇮🇩" },
  { name:"Malaysia",            code:"MY", dial:"+60",  flag:"🇲🇾" },
  { name:"Singapore",           code:"SG", dial:"+65",  flag:"🇸🇬" },
  { name:"Philippines",         code:"PH", dial:"+63",  flag:"🇵🇭" },
  { name:"Thailand",            code:"TH", dial:"+66",  flag:"🇹🇭" },
  { name:"Vietnam",             code:"VN", dial:"+84",  flag:"🇻🇳" },
  { name:"UAE",                 code:"AE", dial:"+971", flag:"🇦🇪" },
  { name:"Saudi Arabia",        code:"SA", dial:"+966", flag:"🇸🇦" },
  { name:"Egypt",               code:"EG", dial:"+20",  flag:"🇪🇬" },
  { name:"Turkey",              code:"TR", dial:"+90",  flag:"🇹🇷" },
  { name:"Israel",              code:"IL", dial:"+972", flag:"🇮🇱" },
  { name:"New Zealand",         code:"NZ", dial:"+64",  flag:"🇳🇿" },
  { name:"Ireland",             code:"IE", dial:"+353", flag:"🇮🇪" },
  { name:"Switzerland",         code:"CH", dial:"+41",  flag:"🇨🇭" },
  { name:"Austria",             code:"AT", dial:"+43",  flag:"🇦🇹" },
  { name:"Belgium",             code:"BE", dial:"+32",  flag:"🇧🇪" },
  { name:"Greece",              code:"GR", dial:"+30",  flag:"🇬🇷" },
  { name:"Russia",              code:"RU", dial:"+7",   flag:"🇷🇺" },
  { name:"Ukraine",             code:"UA", dial:"+380", flag:"🇺🇦" },
  { name:"Romania",             code:"RO", dial:"+40",  flag:"🇷🇴" },
  { name:"Morocco",             code:"MA", dial:"+212", flag:"🇲🇦" },
  { name:"Ethiopia",            code:"ET", dial:"+251", flag:"🇪🇹" },
  { name:"Tanzania",            code:"TZ", dial:"+255", flag:"🇹🇿" },
  { name:"Uganda",              code:"UG", dial:"+256", flag:"🇺🇬" },
  { name:"Cameroon",            code:"CM", dial:"+237", flag:"🇨🇲" },
  { name:"Ivory Coast",         code:"CI", dial:"+225", flag:"🇨🇮" },
  { name:"Senegal",             code:"SN", dial:"+221", flag:"🇸🇳" },
  { name:"Jamaica",             code:"JM", dial:"+1876",flag:"🇯🇲" },
  { name:"Trinidad & Tobago",   code:"TT", dial:"+1868",flag:"🇹🇹" },
];

export function getDefaultCountry(): CountryCode {
  return COUNTRY_CODES.find(c => c.code === "US")!;
}
