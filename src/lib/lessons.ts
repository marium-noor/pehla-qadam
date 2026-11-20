import type { Lang, Plan, Route } from "./types";

export const LESSON_COUNT = 6;

export interface LessonCtx {
  name: string;
  monthly: number;
  plan: Plan;
  route?: Route;
}

export interface Lesson {
  week: number;
  title: string;
  minutes: number;
  paragraphs: string[];
  action: string;
}

const n = (x: number) => Math.round(x).toLocaleString("en-US");
const pkr = (x: number) => "PKR " + n(x);
const rs = (x: number) => n(x) + " روپے";

type Builder = (c: LessonCtx) => { title: string; paragraphs: string[]; action: string };

const STYLE_EN = { cautious: "careful", balanced: "balanced", growth: "growth" } as const;
const STYLE_UR = { cautious: "محتاط", balanced: "متوازن", growth: "نمو پر مرکوز" } as const;

/* ------------------------------ English ------------------------------ */
const EN: Record<number, Builder> = {
  1: (c) => ({
    title: "Rukhsana's committee",
    paragraphs: [
      "Rukhsana Apa teaches at a school in Karachi. For eight years she has put PKR 10,000 a month into a committee. Every time her turn comes she feels proud. The money is safe, and she never missed a payment.",
      "Last month she went to buy the fridge she liked back in 2018. The PKR 100,000 she had saved was no longer enough. Nothing went wrong. Her savings stood still while prices walked ahead. That is inflation, and it is the quiet reason saving alone is not enough.",
      "The committee is not the problem. It is a good habit, and it is halal. But a committee only hands your money back. It never grows it. To grow, money has to sit somewhere that earns a fair profit from real business, not from interest.",
      `${c.name}, a first-timer in Pakistan has three simple halal places to start: an Islamic money market fund, an Islamic bank certificate, or gold. Shares and index funds come later, once you have a safety net.`,
    ],
    action:
      "Open your dashboard and choose where to start. There is no wrong answer. If you are unsure, the money market fund is the easiest, because you can usually take your money out within a working day or two. Next week we show you how it works.",
  }),
  2: (c) => {
    const p = c.plan;
    const third =
      p.startStep === "debt"
        ? `You told us you pay interest on a loan. Until that is cleared, send your monthly ${pkr(c.monthly)} there first. Interest on a loan usually costs more than any fund earns, and interest is riba. Then come back to this plan.`
        : p.startStep === "emergency"
          ? `You do not need a separate account for it. The same Islamic money market fund can hold your safety net, because money comes out quickly. At ${pkr(c.monthly)} a month you would get there in about ${p.monthsToEmergency ?? "a few"} months.`
          : "You already have a safety net, so everything you set aside each month can go toward growing.";
    return {
      title: "Safety first, then growth",
      paragraphs: [
        "Rukhsana's brother Imran once put all his savings into shares. Two months later his motorcycle broke down, and in the same week his daughter needed a doctor. He had to sell on a bad day and lost about a fifth. The investment was not bad. He was forced to sell at the wrong time.",
        `That is why the first rule is a safety net: money you can reach in a day or two, equal to about three months of spending (six if many people depend on you). For your household we estimate ${pkr(p.emergencyTarget)}. It is a rough guide, so adjust it to your real costs.`,
        third,
        "Then comes the slow part, which is the whole point. Profit earned this month earns its own profit next month. After some years the extra is bigger than what you put in yourself. This is compounding. It rewards patience far more than size.",
      ],
      action:
        "Write down your safety-net number, and pick the day of the month you will set money aside. Choose the day right after your salary or income arrives.",
    };
  },
  3: (c) => {
    const route = c.route;
    const routeText =
      route === "fund"
        ? "You chose an Islamic money market fund. Places to look at: Mahaana (a digital-only company), Al Meezan, and ABL Funds. Each runs Shariah-compliant cash funds and lets you open an account in an app. Some start from about PKR 1,000. Check the current minimum on their site."
        : route === "bank"
          ? "You chose an Islamic bank certificate. Places to look at: Meezan Bank and Allied Bank's Aitebar Islamic certificates, which are based on Mudaraba. Profit rates are expected, not promised, so ask for the actual rates of the last few months."
          : route === "gold"
            ? "You chose gold. Places to look at: an Islamic gold fund such as the Meezan Gold Fund, or bars and coins from a reputable dealer. Jewellery is a poor way to invest because of making charges."
            : "You have not picked a starting route yet. Open your dashboard and choose one first: an Islamic money market fund, an Islamic bank certificate, or gold.";
    return {
      title: "Choosing a platform",
      paragraphs: [
        "Before Rukhsana opens anything, she asks three questions. Who regulates it? Who checks that it is halal? What will it cost me?",
        "Regulator: funds and brokers answer to the Securities and Exchange Commission of Pakistan (SECP), banks to the State Bank. You can look a fund up on the MUFAP website, mufap.com.pk. Shariah: a real Islamic fund names its own Shariah board in its documents. Cost: read the total expense ratio and any fee to enter or leave.",
        routeText,
        "These are places to start your research, not recommendations. Compare two or three, and ask a scholar you trust if anything is unclear.",
      ],
      action: "Compare two options on those three questions and write down your pick. Next week you open it.",
    };
  },
  4: (c) => {
    const route = c.route;
    const how =
      route === "fund"
        ? "Keep ready: your CNIC, a mobile number registered in your name, and your bank account details. Most apps check your CNIC and take a selfie. If you already bank with a regulated bank, SECP says you may not need separate KYC for the simple Sahulat accounts, which makes it faster. Then send your first amount from your own bank account to the fund."
        : route === "bank"
          ? "Visit a branch or use the bank's app, and bring your CNIC. Ask for three things in writing: the term, the expected profit, and what happens if you take the money out early."
          : route === "gold"
            ? "If you are buying a fund, follow the same steps as a fund account. If you are buying physical gold, use a reputable dealer and always get a receipt showing weight and purity."
            : "Choose your route on the dashboard first, then come back to this lesson.";
    const amount =
      c.plan.startStep === "debt"
        ? `Your monthly ${pkr(c.monthly)} goes to the loan first. Open the account once the loan is cleared.`
        : `This month, put in ${pkr(c.monthly)}. If that feels like too much, start with half. Starting matters more than size.`;
    return {
      title: "Your first account, your first rupees",
      paragraphs: [
        how,
        amount,
        "One safety rule. Only pay into your own account, through the platform's official app or website. No genuine investment platform asks you to send money to a personal bank account, a JazzCash number or a WhatsApp number. Pehla Qadam never holds or moves your investment money either.",
      ],
      action: "Open the account and make your first transfer. Keep a screenshot of the confirmation for your own records.",
    };
  },
  5: (c) => ({
    title: "Make it automatic",
    paragraphs: [
      "After her first deposit, Rukhsana did one thing. She set a standing instruction at her bank to send the same amount on the same date every month. Now she does not have to remember, and the money does not get lost in a busy month.",
      "She looks at her account once a month, not every day. Three things matter: how much she has put in, what the account is worth today, and how much cost was taken in the fund's monthly report. A money market fund moves very little day to day. A share fund moves up and down a lot. Watching daily only builds worry.",
      "Two more things. First, if your savings pass the nisab and a year goes by, zakat may be due. Ask a scholar how to calculate it for your fund, and take the fund statement with you. Second, promises of fixed returns or doubled money on WhatsApp or TikTok are almost always fraud.",
    ],
    action: `Set a standing instruction or a reminder for ${pkr(c.monthly)} on the day you chose. Check once a month, not once a day.`,
  }),
  6: (c) => {
    const m = c.plan.mix;
    return {
      title: "What comes next",
      paragraphs: [
        "Six months later, Rukhsana asked what next. Her safety net was full, and part of her money could stay for more than five years. So she considered putting a small part in a Shariah-compliant index fund. It moves up and down, but over a long time it has more room to grow.",
        `Your style is ${STYLE_EN[c.plan.riskStyle]}. A common starting mix for it is ${m.cash}% Islamic money market fund, ${m.income}% Islamic income fund, ${m.equity}% Shariah index fund and ${m.gold}% gold. This is an example for learning, not a recommendation. Stay in the money market fund for the first three months, then change slowly.`,
        "One last thing. Share funds sometimes receive a small amount of income that is not Shariah-compliant. That part is given away as charity, which is called purification, or tazkiyah. The fund's report tells you how much.",
        `${c.name}, you have finished the six weeks. You now have an account, a habit and an understanding. That was the first step.`,
      ],
      action:
        "Review your plan on the same day every six months. If something is unclear, ask the assistant. Before any big change, speak to a qualified scholar or a licensed adviser.",
    };
  },
};

/* ------------------------------- Urdu -------------------------------- */
const UR: Record<number, Builder> = {
  1: (c) => ({
    title: "رخسانہ آپا کی کمیٹی",
    paragraphs: [
      "رخسانہ آپا کراچی کے ایک اسکول میں پڑھاتی ہیں۔ آٹھ سال سے وہ ہر ماہ 10,000 روپے کمیٹی میں ڈال رہی ہیں۔ جب بھی ان کی باری آتی ہے تو انہیں فخر ہوتا ہے: پیسہ محفوظ ہے اور ایک قسط بھی نہیں چھوٹی۔",
      "پچھلے مہینے وہ وہی فریج خریدنے گئیں جو 2018 میں پسند آیا تھا۔ جمع شدہ ایک لاکھ روپے اب کم پڑ گئے۔ کچھ غلط نہیں ہوا۔ بس ان کی بچت وہیں کھڑی رہی اور قیمتیں آگے نکل گئیں۔ اسی کو مہنگائی کہتے ہیں، اور یہی خاموش وجہ ہے کہ صرف بچت کافی نہیں۔",
      "کمیٹی کوئی مسئلہ نہیں۔ یہ اچھی عادت ہے اور حلال بھی۔ مگر کمیٹی صرف آپ کا پیسہ واپس کرتی ہے، بڑھاتی نہیں۔ پیسہ بڑھانے کے لیے اسے ایسی جگہ رکھنا پڑتا ہے جہاں حقیقی کاروبار سے جائز منافع ملے، سود سے نہیں۔",
      `${c.name}، پاکستان میں پہلی بار کرنے والوں کے لیے تین آسان حلال راستے ہیں: اسلامی منی مارکیٹ فنڈ، اسلامی بینک سرٹیفکیٹ، یا سونا۔ شیئرز اور انڈیکس فنڈ بعد میں آتے ہیں، جب ہنگامی بچت بن جائے۔`,
    ],
    action:
      "اپنے ڈیش بورڈ پر چنیں کہ کہاں سے شروع کرنا ہے۔ کوئی جواب غلط نہیں۔ اگر یقین نہ ہو تو منی مارکیٹ فنڈ سب سے آسان ہے، کیونکہ عموماً ایک دو کاروباری دن میں پیسہ نکل آتا ہے۔ اگلے ہفتے ہم بتائیں گے یہ کیسے کام کرتا ہے۔",
  }),
  2: (c) => {
    const p = c.plan;
    const third =
      p.startStep === "debt"
        ? `آپ نے بتایا کہ آپ کسی قرض پر سود دیتے ہیں۔ جب تک وہ ادا نہ ہو، ہر ماہ کے ${rs(c.monthly)} پہلے وہیں لگائیں۔ قرض کا سود عموماً کسی فنڈ کی کمائی سے زیادہ مہنگا پڑتا ہے، اور سود ربا ہے۔ اس کے بعد اس پلان پر واپس آئیں۔`
        : p.startStep === "emergency"
          ? `اس کے لیے الگ کھاتا ضروری نہیں۔ وہی اسلامی منی مارکیٹ فنڈ آپ کی ہنگامی بچت بھی رکھ سکتا ہے، کیونکہ اس سے پیسہ جلدی نکل آتا ہے۔ ہر ماہ ${rs(c.monthly)} ڈالیں تو تقریباً ${p.monthsToEmergency ?? "کچھ"} ماہ میں یہ بن جائے گی۔`
          : "آپ کے پاس ہنگامی بچت پہلے سے ہے، اس لیے ہر ماہ الگ رکھی جانے والی پوری رقم بڑھوتری کے لیے لگ سکتی ہے۔";
    return {
      title: "پہلے حفاظت، پھر بڑھوتری",
      paragraphs: [
        "رخسانہ آپا کے بھائی عمران نے ایک بار اپنی ساری بچت شیئرز میں لگا دی۔ دو ماہ بعد موٹر سائیکل خراب ہو گئی اور اسی ہفتے بیٹی کو ڈاکٹر کے پاس بھی لے جانا پڑا۔ مجبوری میں شیئرز برے دن بیچنے پڑے اور تقریباً پانچواں حصہ ڈوب گیا۔ سرمایہ کاری بری نہیں تھی، بیچنے کا وقت مجبوری کا تھا۔",
        `اسی لیے پہلا اصول ہنگامی بچت ہے: ایسی رقم جو ایک دو دن میں مل سکے اور تقریباً تین ماہ کے اخراجات کے برابر ہو (اگر کئی لوگ آپ پر انحصار کرتے ہیں تو چھ ماہ)۔ آپ کے گھر کے لیے ہمارا اندازہ ${rs(p.emergencyTarget)} ہے۔ یہ صرف موٹا اندازہ ہے، اپنے اصل خرچ کے مطابق بدل لیں۔`,
        third,
        "پھر آہستہ کام شروع ہوتا ہے، اور یہی اصل بات ہے۔ ایک مہینے میں ملنے والا منافع اگلے مہینے خود منافع کماتا ہے۔ چند سال بعد یہ اضافہ اس رقم سے بڑھ جاتا ہے جو آپ نے خود ڈالی تھی۔ اسے مرکب منافع (کمپاؤنڈنگ) کہتے ہیں۔ یہ رقم کی مقدار سے زیادہ صبر کو انعام دیتا ہے۔",
      ],
      action:
        "اپنی ہنگامی بچت کی رقم لکھ لیں اور مہینے کا وہ دن طے کریں جب آپ رقم الگ رکھیں گے۔ بہتر ہے کہ تنخواہ یا آمدنی آنے کے فوراً بعد کا دن چنیں۔",
    };
  },
  3: (c) => {
    const route = c.route;
    const routeText =
      route === "fund"
        ? "آپ نے اسلامی منی مارکیٹ فنڈ چنا ہے۔ دیکھنے کے لیے کچھ نام: مہانا (مکمل ڈیجیٹل کمپنی)، المیزان، اور اے بی ایل فنڈز۔ ہر ایک شریعہ کمپلائنٹ کیش فنڈ چلاتا ہے اور ایپ میں کھاتا کھولنے دیتا ہے۔ کچھ تقریباً 1,000 روپے سے شروع ہوتے ہیں۔ موجودہ کم از کم رقم ان کی سائٹ پر دیکھ لیں۔"
        : route === "bank"
          ? "آپ نے اسلامی بینک سرٹیفکیٹ چنا ہے۔ دیکھنے کے لیے کچھ نام: میزان بینک اور الائیڈ بینک کے اعتبار اسلامک سرٹیفکیٹ (مضاربہ پر مبنی)۔ منافع کی شرح متوقع ہوتی ہے، وعدہ نہیں، اس لیے پچھلے چند مہینوں کی اصل شرحیں پوچھیں۔"
          : route === "gold"
            ? "آپ نے سونا چنا ہے۔ دیکھنے کے لیے: میزان گولڈ فنڈ جیسا اسلامی گولڈ فنڈ، یا معتبر ڈیلر سے سونے کے بسکٹ اور سکے۔ زیور سرمایہ کاری کے لیے اچھا نہیں، کیونکہ اس میں میکنگ چارجز لگتے ہیں۔"
            : "آپ نے ابھی شروع کرنے کا راستہ نہیں چنا۔ پہلے ڈیش بورڈ کھول کر چنیں: اسلامی منی مارکیٹ فنڈ، اسلامی بینک سرٹیفکیٹ، یا سونا۔";
    return {
      title: "پلیٹ فارم کا انتخاب",
      paragraphs: [
        "کچھ بھی کھولنے سے پہلے رخسانہ آپا تین سوال پوچھتی ہیں۔ اسے کون ریگولیٹ کرتا ہے؟ کون دیکھتا ہے کہ یہ حلال ہے؟ مجھے کتنا خرچ پڑے گا؟",
        "ریگولیٹر: فنڈز اور بروکرز سیکیورٹیز اینڈ ایکسچینج کمیشن آف پاکستان (SECP) کے تحت ہوتے ہیں، اور بینک اسٹیٹ بینک کے۔ فنڈ کا نام MUFAP کی ویب سائٹ mufap.com.pk پر تلاش کر سکتے ہیں۔ شریعت: حقیقی اسلامی فنڈ اپنی دستاویزات میں اپنے شریعہ بورڈ کا نام دیتا ہے۔ خرچ: ٹوٹل ایکسپینس ریشو اور اندر آنے یا باہر جانے کی کوئی فیس ضرور پڑھیں۔",
        routeText,
        "یہ تحقیق شروع کرنے کی مثالیں ہیں، سفارش نہیں۔ دو تین کا موازنہ کریں، اور کوئی بات واضح نہ ہو تو کسی قابلِ اعتماد عالم سے پوچھیں۔",
      ],
      action: "ان تین سوالوں پر دو آپشنز کا موازنہ کریں اور اپنی پسند لکھ لیں۔ اگلے ہفتے آپ اسے کھولیں گے۔",
    };
  },
  4: (c) => {
    const route = c.route;
    const how =
      route === "fund"
        ? "تیار رکھیں: شناختی کارڈ، اپنے نام پر رجسٹرڈ موبائل نمبر، اور بینک اکاؤنٹ کی تفصیل۔ زیادہ تر ایپس شناختی کارڈ چیک کرتی ہیں اور سیلفی لیتی ہیں۔ اگر آپ پہلے ہی کسی ریگولیٹڈ بینک کے صارف ہیں تو SECP کے مطابق سادہ سہولت اکاؤنٹ کے لیے الگ KYC شاید نہ مانگی جائے، جس سے کام تیز ہو جاتا ہے۔ پھر پہلی رقم اپنے ہی بینک اکاؤنٹ سے فنڈ میں بھیجیں۔"
        : route === "bank"
          ? "بینک کی برانچ جائیں یا بینک کی ایپ استعمال کریں، اور شناختی کارڈ ساتھ رکھیں۔ تین باتیں تحریری طور پر پوچھیں: مدت، متوقع منافع، اور وقت سے پہلے رقم نکالنے پر کیا ہوتا ہے۔"
          : route === "gold"
            ? "اگر فنڈ لے رہے ہیں تو طریقہ فنڈ اکاؤنٹ والا ہی ہے۔ اگر اصل سونا لے رہے ہیں تو معتبر ڈیلر سے لیں اور وزن اور خالص پن کے ساتھ رسید ضرور لیں۔"
            : "پہلے ڈیش بورڈ پر راستہ چن لیں، پھر اس سبق پر واپس آئیں۔";
    const amount =
      c.plan.startStep === "debt"
        ? `آپ کے ہر ماہ کے ${rs(c.monthly)} پہلے قرض میں جائیں گے۔ قرض ختم ہو تو کھاتا کھولیں۔`
        : `اس ماہ ${rs(c.monthly)} ڈالیں۔ اگر یہ زیادہ لگے تو آدھے سے شروع کریں۔ شروع کرنا رقم کے سائز سے زیادہ اہم ہے۔`;
    return {
      title: "پہلا کھاتا، پہلی رقم",
      paragraphs: [
        how,
        amount,
        "حفاظت کا ایک اصول: صرف پلیٹ فارم کی سرکاری ایپ یا ویب سائٹ کے ذریعے، اپنے ہی کھاتے میں رقم بھیجیں۔ کوئی جائز سرمایہ کاری پلیٹ فارم آپ سے کسی ذاتی بینک اکاؤنٹ، جاز کیش نمبر یا واٹس ایپ نمبر پر پیسے نہیں مانگتا۔ پہلا قدم بھی آپ کی سرمایہ کاری کی رقم کبھی اپنے پاس نہیں رکھتا۔",
      ],
      action: "کھاتا کھولیں اور پہلی رقم بھیجیں۔ تصدیق کا اسکرین شاٹ اپنے ریکارڈ کے لیے رکھ لیں۔",
    };
  },
  5: (c) => ({
    title: "اسے خودکار بنائیں",
    paragraphs: [
      "پہلی رقم لگانے کے بعد رخسانہ آپا نے ایک کام کیا: بینک میں ہر ماہ ایک ہی تاریخ پر اتنی ہی رقم خود بخود بھیجنے کی ہدایت (اسٹینڈنگ انسٹرکشن) لگا دی۔ اب انہیں یاد رکھنا نہیں پڑتا، اور مصروف مہینے میں رقم رہ نہیں جاتی۔",
      "وہ مہینے میں ایک بار دیکھتی ہیں، روز نہیں۔ تین چیزیں اہم ہیں: انہوں نے کل کتنا ڈالا، آج کھاتے کی قدر کتنی ہے، اور فنڈ کی ماہانہ رپورٹ میں خرچ کتنا کٹا۔ منی مارکیٹ فنڈ میں روزانہ تبدیلی بہت چھوٹی ہوتی ہے، مگر شیئرز والے فنڈ میں اوپر نیچے زیادہ ہوتا ہے۔ روز دیکھنے سے صرف گھبراہٹ بڑھتی ہے۔",
      "دو باتیں اور۔ پہلی: اگر آپ کی بچت نصاب سے بڑھ جائے اور ایک سال گزر جائے تو زکوٰۃ واجب ہو سکتی ہے۔ حساب کا طریقہ اپنے عالم سے پوچھیں، اور فنڈ کا اسٹیٹمنٹ ساتھ لے جائیں۔ دوسری: واٹس ایپ یا ٹک ٹاک پر پکے منافع یا رقم دگنی کرنے کے وعدے تقریباً ہمیشہ دھوکا ہوتے ہیں۔",
    ],
    action: `اپنی چنی ہوئی تاریخ پر ہر ماہ ${rs(c.monthly)} کی اسٹینڈنگ انسٹرکشن یا یاد دہانی لگا دیں۔ مہینے میں ایک بار دیکھیں، روز نہیں۔`,
  }),
  6: (c) => {
    const m = c.plan.mix;
    return {
      title: "آگے کیا؟",
      paragraphs: [
        "چھ ماہ بعد رخسانہ آپا نے سوچا کہ اب آگے کیا۔ ہنگامی بچت پوری ہو چکی تھی، اور رقم کا کچھ حصہ وہ پانچ سال سے زیادہ کے لیے رکھ سکتی تھیں۔ تب انہوں نے ایک چھوٹا حصہ شریعہ کمپلائنٹ انڈیکس فنڈ میں ڈالنے کا سوچا۔ یہ اوپر نیچے ہوتا ہے، مگر طویل مدت میں اس کے بڑھنے کی گنجائش زیادہ ہے۔",
        `آپ کا انداز "${STYLE_UR[c.plan.riskStyle]}" ہے۔ اس کے لیے ایک عام ابتدائی تقسیم یہ ہے: ${m.cash}% اسلامی منی مارکیٹ فنڈ، ${m.income}% اسلامی انکم فنڈ، ${m.equity}% شریعہ انڈیکس فنڈ، ${m.gold}% سونا۔ یہ سیکھنے کی مثال ہے، سفارش نہیں۔ پہلے تین ماہ صرف منی مارکیٹ فنڈ میں رہیں، پھر آہستہ آہستہ بدلیں۔`,
        "ایک آخری بات: شیئرز والے فنڈز میں کبھی کبھار غیر شرعی آمدنی کا ایک چھوٹا حصہ آ جاتا ہے۔ اسے صدقہ کر دیا جاتا ہے، جسے تزکیہ یا پیوریفکیشن کہتے ہیں۔ فنڈ کی رپورٹ میں اس کی مقدار لکھی ہوتی ہے۔",
        `${c.name}، آپ نے چھ ہفتے مکمل کر لیے۔ اب آپ کے پاس کھاتا ہے، عادت ہے، اور سمجھ ہے۔ یہی پہلا قدم تھا۔`,
      ],
      action:
        "ہر چھ ماہ بعد ایک ہی دن اپنا پلان دیکھیں۔ کوئی بات سمجھ نہ آئے تو اسسٹنٹ سے پوچھیں، اور کسی بڑی تبدیلی سے پہلے مستند عالم یا لائسنس یافتہ مشیر سے بات کریں۔",
    };
  },
};

function wordCount(parts: string[]): number {
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}

export function getLesson(week: number, ctx: LessonCtx, lang: Lang): Lesson {
  const w = Math.min(Math.max(Math.round(week), 1), LESSON_COUNT);
  const built = (lang === "ur" ? UR : EN)[w](ctx);
  // Reading speed: about 200 words a minute, never below 2 so the promise on the page stays honest.
  const minutes = Math.max(2, Math.round(wordCount([...built.paragraphs, built.action]) / 200));
  return { week: w, minutes, ...built };
}

export function lessonTitles(ctx: LessonCtx, lang: Lang): string[] {
  return Array.from({ length: LESSON_COUNT }, (_, i) => getLesson(i + 1, ctx, lang).title);
}
