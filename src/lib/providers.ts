import type { Route } from "./types";

export interface Provider {
  name: { en: string; ur: string };
  note: { en: string; ur: string };
  url: string;
}

/** Example places to research. Not recommendations. Terms change, so every note says to check the site. */
export const PROVIDERS: Record<Route, Provider[]> = {
  fund: [
    {
      name: { en: "Mahaana", ur: "مہانا" },
      note: { en: "Digital-only asset manager with an Islamic cash fund.", ur: "مکمل ڈیجیٹل ادارہ، اسلامی کیش فنڈ کے ساتھ۔" },
      url: "https://www.mahaana.com",
    },
    {
      name: { en: "Al Meezan", ur: "المیزان" },
      note: { en: "Large Shariah-only fund manager with several cash and income funds.", ur: "بڑا شریعہ فنڈ مینیجر، کئی کیش اور انکم فنڈز۔" },
      url: "https://www.meezanbank.com/asset-management",
    },
    {
      name: { en: "ABL Funds", ur: "اے بی ایل فنڈز" },
      note: { en: "Offers Shariah-compliant funds and a digital account inside the myABL app.", ur: "شریعہ کمپلائنٹ فنڈز اور myABL ایپ میں ڈیجیٹل کھاتا۔" },
      url: "https://www.ablfunds.com",
    },
  ],
  bank: [
    {
      name: { en: "Meezan Bank", ur: "میزان بینک" },
      note: { en: "Islamic bank with term deposits and certificates.", ur: "اسلامی بینک، ٹرم ڈپازٹ اور سرٹیفکیٹ۔" },
      url: "https://www.meezanbank.com",
    },
    {
      name: { en: "Allied Aitebar certificates", ur: "الائیڈ اعتبار سرٹیفکیٹ" },
      note: { en: "Islamic investment certificates based on Mudaraba.", ur: "مضاربہ پر مبنی اسلامی سرمایہ کاری سرٹیفکیٹ۔" },
      url: "https://www.abl.com/halal-investment-pakistan/",
    },
  ],
  gold: [
    {
      name: { en: "Meezan Gold Fund", ur: "میزان گولڈ فنڈ" },
      note: { en: "An Islamic gold fund from Al Meezan.", ur: "المیزان کا اسلامی گولڈ فنڈ۔" },
      url: "https://www.meezanbank.com/asset-management",
    },
  ],
};

export const VERIFY_LINKS = [
  { label: { en: "SECP", ur: "SECP" }, url: "https://www.secp.gov.pk" },
  { label: { en: "MUFAP fund list", ur: "MUFAP فنڈ لسٹ" }, url: "https://www.mufap.com.pk" },
];
