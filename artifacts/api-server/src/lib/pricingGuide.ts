// Server-only: this includes internal packaging guidance and an internal source.
// Never import into the web application or public search index.
export const pricingGuide = {
  intro: "The standard bundle is $83 per agent per month, billed yearly, plus a Zendesk Suite plan and the required Premier support plan. Suite and Premier are additional costs.",
  billing: "The public U.S. Contact Center bundle price is billed yearly. Alternate offers explicitly marked internal guidance are not independently verified public list prices or availability commitments. Telephony and AWS usage, Suite and Premier are additional; confirm the final quote and agreement.",
  methods: [
    {
      id: "bundle",
      name: "Zendesk Contact Center",
      tag: "The bundle",
      fit: "Primary motion",
      price: "$83",
      unit: "per agent / month · billed yearly",
      summary: "Zendesk sells Contact Center and Amazon Connect together on one contract.",
      details: [
        "$50 Contact Center license + $33 Minutes Block.",
        "Includes one 1,000-minute block per agent.",
        "Requires an additional Zendesk Suite plan and Premier support plan.",
        "Amazon Connect telephony and additional AWS services are charged by usage.",
      ],
    },
    {
      id: "byoa",
      name: "Contact Center License",
      tag: "BYOA",
      fit: "Existing AWS relationship",
      price: "$50",
      unit: "per agent / month · internal guidance",
      summary: "Bring your own Amazon Connect: for customers with an AWS relationship or who want to keep buying from Amazon directly.",
      details: [
        "Contact Center license price from internal pricing guidance.",
        "The customer pays Amazon directly for Connect and AWS usage.",
        "Suite and support requirements may depend on the customer's package; confirm the quote.",
      ],
    },
    {
      id: "team",
      name: "Contact Center Team",
      tag: "The lighter-weight path",
      fit: "Greenfield / net-new",
      price: "Request a quote",
      unit: "Confirm packaging and commercial terms",
      summary: "Internal guidance describes a lighter-weight path for greenfield and net-new customers. This is not independently verified as a currently available Suite-free offer; confirm the product, eligibility and prerequisites with Zendesk.",
      details: [
        "No Team list price was provided in this pricing guidance.",
        "Confirm current pricing, availability, and requirements with Zendesk.",
      ],
    },
  ],
  costs: [
    {
      item: "Contact Center bundle",
      price: "$83 / agent / month",
      covers: "Contact Center license plus one Minutes Block. Requires a Suite plan and Premier plan, both at additional cost.",
    },
    {
      item: "Additional Minutes Block",
      price: "$33 / agent / month",
      covers: "Another 1,000-minute block per agent. Blocks are purchased for all Contact Center agents.",
    },
    {
      item: "Suite plan",
      price: "Varies by plan",
      covers: "Required base subscription for the standard bundle.",
    },
    {
      item: "Premier support",
      price: "Quoted separately",
      covers: "Required with the bundle. Internal guidance says Premier Plus or Premier Enterprise is typical.",
    },
  ],
  notes: [
    {
      title: "Minutes pooling and reset",
      body: "Each 1,000-minute block is pooled across agents for the 12-month period and resets annually. Additional blocks are purchased for all Contact Center agents.",
    },
    {
      title: "Contract term and billing",
      body: "Internal sales guidance lists a 12-month minimum. Zendesk's public billing guidance describes 12-month or multi-year terms, with billing cadence set by the agreement.",
    },
    {
      title: "Additional usage",
      body: "Amazon Connect telephony and additional AWS services are usage-based charges. Zendesk's billing article explains the invoice categories and usage billing. The bundle price is not the full cost of service.",
    },
    {
      title: "Regional price lists",
      body: "The internal guide lists GBP, EUR, and BRL rates in addition to USD. Treat these as internal quoting guidance and verify the applicable regional price list when preparing an offer.",
    },
  ],
  sources: [
    {
      title: "Zendesk Contact Center pricing",
      url: "https://www.zendesk.com/pricing/contact-center/",
      note: "Public list pricing and Minutes Block details.",
      internal: false,
    },
    {
      title: "Understanding Contact Center billing",
      url: "https://support.zendesk.com/hc/en-us/articles/10263112119066-Understanding-Contact-Center-billing",
      note: "Invoice types, usage charges, and pooled minutes.",
      internal: false,
    },
    {
      title: "Internal Contact Center Pricing & Packaging Guide",
      url: "https://docs.google.com/presentation/d/1ss7suqbrteWmW37mIX2zc5pDubPvGbNyAwbZLPgqSxM/edit",
      note: "Internal packaging, regional rates, BYOA, and support requirements. Last modified November 11, 2026, according to the supplied guidance. Source permissions still apply.",
      internal: true,
    },
  ],
};
