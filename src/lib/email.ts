import type { Answers, Lang } from "./types";
import { computePlan } from "./plan";
import { getLesson, LESSON_COUNT } from "./lessons";
import type { Route } from "./types";
import { PRICING, pkrAmount } from "./pricing";
import { translate, type Key } from "./i18n";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const COPY = {
  en: {
    week: (n: number) => `Week ${n} of ${LESSON_COUNT}`,
    todo: "Do this week",
    open: "Open my plan",
    foot: "Pehla Qadam is an education tool. It is not a broker, fund manager or licensed investment adviser, and nothing here is a recommendation to buy or sell. Returns are never guaranteed. Confirm Shariah compliance with a scholar you trust.",
    unsub: "Stop these emails",
  },
  ur: {
    week: (n: number) => `ہفتہ ${n} از ${LESSON_COUNT}`,
    todo: "اس ہفتے کا کام",
    open: "میرا پلان کھولیں",
    foot: "پہلا قدم ایک تعلیمی ٹول ہے۔ یہ بروکر، فنڈ مینیجر یا لائسنس یافتہ سرمایہ کاری مشیر نہیں، اور یہاں کی کوئی بات خریدنے یا بیچنے کی سفارش نہیں۔ منافع کی ضمانت نہیں۔ شریعت کی تصدیق کسی قابلِ اعتماد عالم سے کریں۔",
    unsub: "یہ ای میلز بند کریں",
  },
} as const;

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildLessonEmail(opts: {
  answers: Answers;
  week: number;
  route?: Route;
  token: string;
  lang?: Lang;
}): BuiltEmail {
  const lang = opts.lang ?? opts.answers.lang;
  const plan = computePlan(opts.answers);
  const lesson = getLesson(opts.week, { name: opts.answers.name, monthly: opts.answers.monthly, plan, route: opts.route }, lang);
  const c = COPY[lang];
  const rtl = lang === "ur";
  const link = `${siteUrl()}/d/${opts.token}`;
  const unsub = `${siteUrl()}/api/unsubscribe/${opts.token}`;
  const font = rtl
    ? `'Noto Nastaliq Urdu','Jameel Noori Nastaleeq','Noto Naskh Arabic',Tahoma,serif`
    : `-apple-system,'Segoe UI',Helvetica,Arial,sans-serif`;
  const lh = rtl ? "2.1" : "1.65";
  const paras = lesson.paragraphs.map((p) => `<p style="margin:0 0 18px;font-size:17px;line-height:${lh};color:#1d1d1f">${esc(p)}</p>`).join("");
  const html = `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><body style="margin:0;background:#f5f5f7;padding:24px 12px;font-family:${font}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px 28px;text-align:${rtl ? "right" : "left"}">
<tr><td>
<div style="font-size:14px;color:#6e6e73;margin-bottom:6px">${esc(c.week(lesson.week))}</div>
<h1 style="margin:0 0 20px;font-size:26px;line-height:${rtl ? "1.9" : "1.25"};color:#1d1d1f;font-weight:600">${esc(lesson.title)}</h1>
${paras}
<div style="background:#f5f5f7;border-radius:12px;padding:16px 18px;margin:8px 0 24px">
<div style="font-size:14px;color:#0b6b4f;font-weight:600;margin-bottom:6px">${esc(c.todo)}</div>
<div style="font-size:16px;line-height:${lh};color:#1d1d1f">${esc(lesson.action)}</div></div>
<a href="${link}" style="display:inline-block;background:#1d1d1f;color:#ffffff;text-decoration:none;border-radius:980px;padding:12px 24px;font-size:16px">${esc(c.open)}</a>
<p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#6e6e73">${esc(c.foot)}</p>
<p style="margin:10px 0 0;font-size:12px"><a href="${unsub}" style="color:#6e6e73">${esc(c.unsub)}</a></p>
</td></tr></table></td></tr></table></body></html>`;
  const text = [c.week(lesson.week), lesson.title, "", ...lesson.paragraphs, "", `${c.todo}: ${lesson.action}`, "", link, "", c.foot, `${c.unsub}: ${unsub}`].join("\n");
  return { subject: `${lesson.title} (${c.week(lesson.week)})`, html, text };
}

export async function sendEmail(to: string, mail: BuiltEmail): Promise<boolean> {
  if (!emailConfigured()) return false;
  const res = await fetch(`${process.env.RESEND_BASE_URL || "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject: mail.subject, html: mail.html, text: mail.text }),
  });
  if (!res.ok) {
    console.error("Resend error", res.status, (await res.text()).slice(0, 200));
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------------------------
// Plan emails: request confirmation (user), request notification (owner), monthly check-in (paid users).
// ---------------------------------------------------------------------------------------------

const money = (lang: Lang, n: number) => (lang === "ur" ? `${pkrAmount(n)} روپے` : `PKR ${pkrAmount(n)}`);

/** The one sentence about money that every plan email repeats. */
const MONEY_CLAIM = {
  en: "We never hold or move your investment money. You only ever pay Pehla Qadam for the course.",
  ur: "ہم آپ کی سرمایہ کاری کی رقم کبھی اپنے پاس نہیں رکھتے اور نہ ہی آگے منتقل کرتے ہیں۔ آپ صرف پہلا قدم کو کورس کی فیس دیتے ہیں۔",
} as const;

/** Same look as the lesson email: heading, paragraphs, one button, disclaimer, unsubscribe. */
function shell(opts: { lang: Lang; heading: string; paras: string[]; button?: { label: string; url: string }; unsubToken?: string }): BuiltEmail {
  const { lang } = opts;
  const c = COPY[lang];
  const rtl = lang === "ur";
  const font = rtl
    ? `'Noto Nastaliq Urdu','Jameel Noori Nastaleeq','Noto Naskh Arabic',Tahoma,serif`
    : `-apple-system,'Segoe UI',Helvetica,Arial,sans-serif`;
  const lh = rtl ? "2.1" : "1.65";
  const unsub = opts.unsubToken ? `${siteUrl()}/api/unsubscribe/${opts.unsubToken}` : null;
  const paras = opts.paras.map((p) => `<p style="margin:0 0 18px;font-size:17px;line-height:${lh};color:#1d1d1f">${esc(p)}</p>`).join("");
  const button = opts.button
    ? `<a href="${esc(opts.button.url)}" style="display:inline-block;background:#1d1d1f;color:#ffffff;text-decoration:none;border-radius:980px;padding:12px 24px;font-size:16px">${esc(opts.button.label)}</a>`
    : "";
  const html = `<!doctype html><html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><body style="margin:0;background:#f5f5f7;padding:24px 12px;font-family:${font}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px 28px;text-align:${rtl ? "right" : "left"}">
<tr><td>
<h1 style="margin:0 0 20px;font-size:26px;line-height:${rtl ? "1.9" : "1.25"};color:#1d1d1f;font-weight:600">${esc(opts.heading)}</h1>
${paras}
${button}
<p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#6e6e73">${esc(c.foot)}</p>
${unsub ? `<p style="margin:10px 0 0;font-size:12px"><a href="${unsub}" style="color:#6e6e73">${esc(c.unsub)}</a></p>` : ""}
</td></tr></table></td></tr></table></body></html>`;
  const text = [opts.heading, "", ...opts.paras, "", ...(opts.button ? [`${opts.button.label}: ${opts.button.url}`, ""] : []), c.foot, ...(unsub ? [`${c.unsub}: ${unsub}`] : [])].join("\n");
  return { subject: opts.heading, html, text };
}

const PLAN_COPY = {
  en: {
    reqHeading: "We got your request for Plus",
    reqHi: (name: string) => `Hi ${name}, thank you.`,
    reqNext: "We will contact you to complete payment by JazzCash, Easypaisa or bank transfer.",
    reqPrice: `Plus is PKR ${pkrAmount(PRICING.plus.priceMonthly)} a month or PKR ${pkrAmount(PRICING.plus.priceYearly)} a year.`,
    open: "Open my plan",
    checkHeading: "Your monthly plan check-in",
    checkHi: (name: string) => `Hi ${name}, once a month we look at your plan again, using the answers you saved.`,
    checkNow: (s: string) => `Right now: ${s}`,
    checkAmount: (m: string) => `You told us you can set aside ${m} a month. If that has changed, open your plan and update the amount. Your plan is recalculated straight away.`,
    checkButton: "Update my monthly amount",
  },
  ur: {
    reqHeading: "پلس کے لیے آپ کی درخواست مل گئی",
    reqHi: (name: string) => `السلام علیکم ${name}، شکریہ۔`,
    reqNext: "ہم آپ سے رابطہ کر کے جاز کیش، ایزی پیسہ یا بینک ٹرانسفر سے ادائیگی مکمل کروائیں گے۔",
    reqPrice: `پلس کی قیمت ماہانہ ${pkrAmount(PRICING.plus.priceMonthly)} روپے یا سالانہ ${pkrAmount(PRICING.plus.priceYearly)} روپے ہے۔`,
    open: "میرا پلان کھولیں",
    checkHeading: "آپ کے پلان کا ماہانہ جائزہ",
    checkHi: (name: string) => `السلام علیکم ${name}، مہینے میں ایک بار ہم آپ کے محفوظ کردہ جوابات سے آپ کا پلان دوبارہ دیکھتے ہیں۔`,
    checkNow: (s: string) => `اس وقت: ${s}`,
    checkAmount: (m: string) => `آپ نے بتایا تھا کہ آپ ہر ماہ ${m} الگ رکھ سکتے ہیں۔ اگر یہ بدل گیا ہو تو اپنا پلان کھول کر رقم تبدیل کر دیں۔ پلان فوراً دوبارہ بن جاتا ہے۔`,
    checkButton: "ماہانہ رقم تبدیل کریں",
  },
} as const;

/** Sent to the person who asked for Plus. */
export function buildPlanRequestEmail(opts: { name: string; lang: Lang; token: string }): BuiltEmail {
  const c = PLAN_COPY[opts.lang];
  return shell({
    lang: opts.lang,
    heading: c.reqHeading,
    paras: [c.reqHi(opts.name), c.reqNext, c.reqPrice, MONEY_CLAIM[opts.lang]],
    button: { label: c.open, url: `${siteUrl()}/d/${opts.token}` },
    unsubToken: opts.token,
  });
}

/** Sent to the site owner (NOTIFY_EMAIL). English only. Includes the SQL to activate, but never the token. */
export function buildPlanNotifyEmail(opts: { name: string; email: string; lang: Lang; plan: string }): BuiltEmail {
  const sqlEmail = opts.email.replace(/'/g, "''");
  const mail = shell({
    lang: "en",
    heading: `Plan request: ${opts.plan} from ${opts.name}`,
    paras: [
      `Name: ${opts.name}`,
      `Email: ${opts.email}`,
      `Language: ${opts.lang}`,
      `Requested: ${opts.plan}`,
      `Contact them to arrange payment (JazzCash, Easypaisa or bank transfer). To activate: update public.profiles set plan = '${opts.plan}' where email = '${sqlEmail}';`,
    ],
  });
  return mail;
}

/** Monthly check-in for Plus and Teams. The plan is recomputed from the saved answers every time. */
export function buildCheckinEmail(opts: { answers: Answers; token: string; lang?: Lang }): BuiltEmail {
  const lang = opts.lang ?? opts.answers.lang;
  const plan = computePlan(opts.answers);
  const c = PLAN_COPY[lang];
  const start = translate(lang, `dash.start.${plan.startStep}` as Key, {
    target: money(lang, plan.emergencyTarget),
    monthly: money(lang, plan.monthly),
    months: plan.monthsToEmergency ?? "",
  });
  return shell({
    lang,
    heading: c.checkHeading,
    paras: [c.checkHi(opts.answers.name), c.checkNow(start), c.checkAmount(money(lang, plan.monthly))],
    button: { label: c.checkButton, url: `${siteUrl()}/d/${opts.token}` },
    unsubToken: opts.token,
  });
}
