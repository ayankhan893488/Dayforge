import { useStore } from "@/lib/store";

export type Lang = "en" | "hi";

export const LANGUAGES: { key: Lang; name: string; native: string }[] = [
  { key: "en", name: "English", native: "English" },
  { key: "hi", name: "Hindi", native: "हिन्दी" },
];

const en = {
  // nav
  "nav.home": "Home",
  "nav.calendar": "Calendar",
  "nav.log": "Log",
  "nav.reports": "Reports",
  "nav.stats": "Stats",
  "nav.settings": "Settings",
  // attendance
  "att.present": "Present",
  "att.nightShift": "Night Shift",
  "att.absent": "Absent",
  "att.value": "Value",
  "att.days": "Days",
  "att.remaining": "Remaining",
  "att.attendance": "Attendance",
  "att.attendanceTitle": "Attendance",
  "att.markHint": "Tap P for a normal day, P+ to add a night shift, A for absent.",
  "att.presentValue": "Present",
  "att.nightValue": "Present + Night",
  "att.changeInSettings": "change in Settings",
  // sections
  "s.settings": "Settings",
  "s.personal": "Personal",
  "s.yourName": "Your Name",
  "s.appName": "App Name",
  "s.appNameHint": "Change how the app is labeled everywhere.",
  "s.themes": "Themes",
  "s.earnings": "Earnings",
  "s.currency": "Currency",
  "s.ratePerDay": "Rate per day",
  "s.defaultDaily": "Default Daily Attendance",
  "s.defaultDailyHint": "Used for every new Present mark. Existing records stay unchanged.",
  "s.nightValue": "Present + Night Shift Value",
  "s.nightValueHint": "Total value for a day where you also worked a night shift.",
  "s.language": "Language",
  "s.languageHint": "Switches instantly. Your attendance data is never affected.",
  "s.welcome": "Welcome Screen",
  "s.welcomeName": "Welcome Name",
  "s.greetingText": "Greeting Text",
  "s.welcomeMessage": "Welcome Message",
  "s.welcomeAnimation": "Opening Animation",
  "s.showWelcome": "Show welcome animation",
  "s.database": "Database",
  "s.backup": "Backup & Restore",
  "s.reset": "Reset Data",
  "s.engine": "Engine",
  "s.records": "attendance records",
  "s.logEntries": "log entries",
  "s.offline": "works fully offline",
  "s.lastAutoBackup": "Last automatic backup",
  "s.notYet": "not yet",
  // animations
  "anim.fade": "Fade",
  "anim.slide": "Slide Up",
  "anim.zoom": "Zoom",
  "anim.glass": "Glass Morph",
  "anim.gradient": "Gradient",
  "anim.neon": "Neon Glow",
  "anim.minimal": "Minimal Pro",
  "anim.premium": "Premium Motion",
  "anim.particles": "Particles",
  "anim.splash": "Dynamic Splash",
  "anim.none": "None",
  // misc
  "c.reports": "Reports",
  "c.calendar": "Calendar",
  "c.statistics": "Statistics",
  "c.dashboard": "Dashboard",
};

type Key = keyof typeof en;

const hi: Record<Key, string> = {
  "nav.home": "होम",
  "nav.calendar": "कैलेंडर",
  "nav.log": "लॉग",
  "nav.reports": "रिपोर्ट",
  "nav.stats": "आँकड़े",
  "nav.settings": "सेटिंग्स",
  "att.present": "उपस्थित",
  "att.nightShift": "नाइट शिफ्ट",
  "att.absent": "अनुपस्थित",
  "att.value": "कुल मान",
  "att.days": "दिन",
  "att.remaining": "शेष",
  "att.attendance": "उपस्थिति",
  "att.attendanceTitle": "उपस्थिति",
  "att.markHint": "सामान्य दिन के लिए P, नाइट शिफ्ट जोड़ने के लिए P+, अनुपस्थिति के लिए A दबाएँ।",
  "att.presentValue": "उपस्थित",
  "att.nightValue": "उपस्थित + नाइट",
  "att.changeInSettings": "सेटिंग्स में बदलें",
  "s.settings": "सेटिंग्स",
  "s.personal": "व्यक्तिगत",
  "s.yourName": "आपका नाम",
  "s.appName": "ऐप का नाम",
  "s.appNameHint": "पूरे ऐप में दिखने वाला नाम बदलें।",
  "s.themes": "थीम",
  "s.earnings": "कमाई",
  "s.currency": "मुद्रा",
  "s.ratePerDay": "प्रति दिन दर",
  "s.defaultDaily": "डिफ़ॉल्ट दैनिक उपस्थिति",
  "s.defaultDailyHint": "हर नई उपस्थिति के लिए उपयोग होता है। पुराने रिकॉर्ड नहीं बदलते।",
  "s.nightValue": "उपस्थित + नाइट शिफ्ट मान",
  "s.nightValueHint": "उस दिन का कुल मान जब आपने नाइट शिफ्ट भी की हो।",
  "s.language": "भाषा",
  "s.languageHint": "तुरंत बदलती है। आपका डेटा प्रभावित नहीं होता।",
  "s.welcome": "वेलकम स्क्रीन",
  "s.welcomeName": "वेलकम नाम",
  "s.greetingText": "अभिवादन टेक्स्ट",
  "s.welcomeMessage": "वेलकम संदेश",
  "s.welcomeAnimation": "ओपनिंग एनिमेशन",
  "s.showWelcome": "वेलकम एनिमेशन दिखाएँ",
  "s.database": "डेटाबेस",
  "s.backup": "बैकअप और रिस्टोर",
  "s.reset": "डेटा रीसेट करें",
  "s.engine": "इंजन",
  "s.records": "उपस्थिति रिकॉर्ड",
  "s.logEntries": "लॉग एंट्री",
  "s.offline": "पूरी तरह ऑफ़लाइन काम करता है",
  "s.lastAutoBackup": "अंतिम स्वचालित बैकअप",
  "s.notYet": "अभी नहीं",
  "anim.fade": "फ़ेड",
  "anim.slide": "स्लाइड अप",
  "anim.zoom": "ज़ूम",
  "anim.glass": "ग्लास मॉर्फ",
  "anim.gradient": "ग्रेडिएंट",
  "anim.neon": "नियॉन ग्लो",
  "anim.minimal": "मिनिमल प्रो",
  "anim.premium": "प्रीमियम मोशन",
  "anim.particles": "पार्टिकल्स",
  "anim.splash": "डायनामिक स्प्लैश",
  "anim.none": "कोई नहीं",
  "c.reports": "रिपोर्ट",
  "c.calendar": "कैलेंडर",
  "c.statistics": "आँकड़े",
  "c.dashboard": "डैशबोर्ड",
};

const dict: Record<Lang, Record<Key, string>> = { en, hi };

export function translate(lang: Lang, key: Key) {
  return dict[lang]?.[key] ?? en[key] ?? key;
}

/** Reactive translator — components re-render instantly on language change. */
export function useT() {
  const lang = useStore((s) => s.language);
  return (key: Key) => translate(lang, key);
}