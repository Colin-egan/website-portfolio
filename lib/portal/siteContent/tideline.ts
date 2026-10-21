import type { FieldSpec, SiteSpec } from "@/lib/portal/siteContent/spec";

/**
 * TideLine Living (tidelineliving repo). Keys mirror src/content/schema.ts there;
 * the site falls back to src/content/defaults.ts for anything not saved here.
 *
 * Deliberately not editable: the legal disclaimer (regulatory wording), the live
 * domain, nav and footer link labels, form fields, and the illustrations.
 *
 * No deploy hook: the site regenerates its pages from Supabase every minute, so
 * saves go live on their own.
 */

const PRICE_TOKEN_HINT = "Write {price} where the price should appear — it's filled in from Prices.";

const seo: FieldSpec = {
  kind: "group",
  key: "seo",
  label: "Search listing",
  hint: "How this page appears in Google results and browser tabs.",
  fields: [
    { kind: "text", key: "title", label: "Page title" },
    { kind: "text", key: "description", label: "Description", multiline: true },
  ],
};

function hero(extra: FieldSpec[] = [], bodyHint?: string): FieldSpec {
  return {
    kind: "group",
    key: "hero",
    label: "Top of page",
    fields: [
      { kind: "text", key: "kicker", label: "Small label above the title" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "text", key: "body", label: "Intro text", multiline: true, hint: bodyHint },
      { kind: "image", key: "image", label: "Photo" },
      ...extra,
    ],
  };
}

function heading(key: string, label: string, extra: FieldSpec[] = []): FieldSpec {
  return {
    kind: "group",
    key,
    label,
    fields: [
      { kind: "text", key: "eyebrow", label: "Small label" },
      { kind: "text", key: "title", label: "Heading" },
      ...extra,
    ],
  };
}

const cta: FieldSpec = {
  kind: "group",
  key: "cta",
  label: "Closing banner",
  fields: [
    { kind: "text", key: "title", label: "Heading" },
    { kind: "text", key: "body", label: "Text", multiline: true },
    { kind: "text", key: "label", label: "Button text" },
  ],
};

const priceFields: FieldSpec[] = [
  { kind: "text", key: "label", label: "Name" },
  {
    kind: "number",
    key: "amount",
    label: "Price ($)",
    optional: true,
    hint: "Leave blank to show “Request a quote”.",
  },
  {
    kind: "number",
    key: "amountMax",
    label: "Up to ($)",
    optional: true,
    hint: "Only for a range, e.g. $5–$10.",
  },
  { kind: "text", key: "note", label: "Small note underneath", optional: true },
];

function priceList(key: string, label: string, hint?: string): FieldSpec {
  return { kind: "repeat", key, label, hint, itemLabel: "Price", fields: priceFields, max: 20 };
}

function serviceCard(key: string, label: string): FieldSpec {
  return {
    kind: "group",
    key,
    label,
    fields: [
      { kind: "text", key: "title", label: "Name" },
      { kind: "text", key: "from", label: "Price line", hint: PRICE_TOKEN_HINT + " (monthly base)" },
      { kind: "text", key: "body", label: "Description", multiline: true },
      { kind: "text", key: "cta", label: "Link text" },
    ],
  };
}

export const tidelineSpec: SiteSpec = {
  previewOrigin: "https://tidelineliving.vercel.app",
  liveOnSave: true,
  sections: [
    {
      key: "business",
      title: "Business info",
      description:
        "Contact details shown in the footer, on the Contact page, and to search engines. Form submissions are emailed to the email address here.",
      fields: [
        { kind: "text", key: "name", label: "Legal name" },
        { kind: "text", key: "shortName", label: "Short name" },
        { kind: "text", key: "tagline", label: "Tagline" },
        { kind: "text", key: "phone", label: "Phone" },
        { kind: "text", key: "email", label: "Email" },
        { kind: "text", key: "serviceArea", label: "Service area", hint: "e.g. Gulf Shores & Orange Beach, AL" },
        { kind: "text", key: "hours", label: "Hours" },
        { kind: "text", key: "addressLocality", label: "City" },
        { kind: "text", key: "addressRegion", label: "State", hint: "Two letters, e.g. AL" },
      ],
    },
    {
      key: "pricing",
      title: "Prices",
      description: "Every price on the site. Change a number here and it updates everywhere it appears.",
      fields: [
        { kind: "number", key: "baseMonthlyMin", label: "Monthly base — from ($)" },
        { kind: "number", key: "baseMonthlyMax", label: "Monthly base — up to ($)" },
        {
          kind: "number",
          key: "exampleBase",
          label: "Example monthly base ($)",
          hint: "Used in the cost chart and the example pricing table.",
        },
        { kind: "number", key: "vacationPrepFrom", label: "Vacation Prep — from, per reservation ($)" },
        {
          kind: "repeat",
          key: "rentalTiers",
          label: "Vacation Prep by rentals per month",
          hint: "The example table and chart. Totals and averages are calculated for you.",
          itemLabel: "Row",
          max: 15,
          fields: [
            { kind: "number", key: "rentals", label: "Rentals / month" },
            { kind: "number", key: "prep", label: "Prep charges ($)" },
          ],
        },
        priceList(
          "additionalServices",
          "Additional services",
          "The first three also appear on the Contact page under “Outside normal hours”.",
        ),
        priceList("groceryTiers", "Stock the Frig! (grocery shopping)"),
        priceList("petServices", "Tail Time (pet care)"),
        { kind: "group", key: "beachRentals", label: "Beach toys & rentals", fields: priceFields },
        {
          kind: "repeat",
          key: "celebrationPackages",
          label: "Party packages",
          itemLabel: "Package",
          max: 6,
          fields: [
            { kind: "text", key: "name", label: "Name" },
            { kind: "number", key: "amount", label: "Price ($)" },
            { kind: "list", key: "includes", label: "What's included", hint: "One per line." },
          ],
        },
      ],
    },
    {
      key: "home",
      title: "Home",
      fields: [
        seo,
        hero([
          { kind: "text", key: "primaryLabel", label: "Main button text" },
          { kind: "text", key: "secondaryLabel", label: "Second button text" },
        ]),
        heading("standard", "Turnover checklist section", [
          { kind: "text", key: "body", label: "Text", multiline: true },
        ]),
        heading("services", "Services", [
          { kind: "text", key: "body", label: "Text", multiline: true },
          serviceCard("guestServices", "Guest Services column"),
          serviceCard("cleaning", "Cleaning column"),
          serviceCard("aLaCarte", "À la Carte column"),
        ]),
        heading("why", "Why an operations partner", [
          { kind: "paragraphs", key: "paragraphs", label: "Text", hint: "Leave a blank line between paragraphs." },
        ]),
        cta,
      ],
    },
    {
      key: "about",
      title: "About",
      fields: [
        seo,
        hero(),
        {
          kind: "paragraphs",
          key: "story",
          label: "Your story",
          hint: "Leave a blank line between paragraphs.",
        },
        cta,
      ],
    },
    {
      key: "guestServices",
      title: "Guest Services",
      fields: [
        seo,
        hero([], PRICE_TOKEN_HINT + " (monthly base)"),
        heading("base", "What the monthly base covers", [
          { kind: "text", key: "body", label: "Text", multiline: true },
          { kind: "list", key: "includes", label: "Checklist", hint: "One per line." },
        ]),
        heading("costs", "Example pricing table"),
        heading("prep", "Vacation Prep", [
          { kind: "text", key: "body", label: "Text", multiline: true, hint: PRICE_TOKEN_HINT + " (Vacation Prep)" },
          { kind: "list", key: "before", label: "Before arrival", hint: "One per line." },
          { kind: "list", key: "during", label: "During the stay", hint: "One per line." },
          { kind: "list", key: "after", label: "After departure", hint: "One per line." },
        ]),
        heading("additional", "Additional services"),
        cta,
      ],
    },
    {
      key: "cleaning",
      title: "Cleaning",
      description: "The turnover checklist here is also shown on the home page.",
      fields: [
        seo,
        hero(),
        heading("checklist", "Turnover checklist", [
          { kind: "text", key: "body", label: "Text", multiline: true },
          {
            kind: "list",
            key: "items",
            label: "Checklist",
            hint: "One per line. The last line is shown as the final check.",
          },
          { kind: "text", key: "terminal", label: "Note under the final check" },
        ]),
        { kind: "image", key: "band", label: "Wide photo strip", decorative: true },
        heading("quote", "Quote request", [
          { kind: "text", key: "body", label: "Text", multiline: true },
          { kind: "text", key: "note", label: "Small note", multiline: true, optional: true },
        ]),
      ],
    },
    {
      key: "aLaCarte",
      title: "À la Carte",
      fields: [
        seo,
        hero(),
        {
          kind: "group",
          key: "groceries",
          label: "Stock the Frig!",
          fields: [
            { kind: "text", key: "script", label: "Script title" },
            { kind: "text", key: "title", label: "Heading" },
            { kind: "text", key: "body", label: "Text", multiline: true },
            { kind: "text", key: "formTitle", label: "Form heading" },
          ],
        },
        {
          kind: "group",
          key: "pets",
          label: "Tail Time",
          fields: [
            { kind: "text", key: "script", label: "Script title" },
            { kind: "text", key: "title", label: "Heading" },
            { kind: "text", key: "body", label: "Text", multiline: true },
          ],
        },
        {
          kind: "group",
          key: "beach",
          label: "Beach Toys & Rentals",
          hint: "The text under this heading is the note on the beach rentals price.",
          fields: [
            { kind: "text", key: "script", label: "Script title" },
            { kind: "text", key: "title", label: "Heading" },
          ],
        },
        {
          kind: "group",
          key: "request",
          label: "Can't find what you need?",
          fields: [
            { kind: "text", key: "title", label: "Heading" },
            { kind: "text", key: "body", label: "Text", multiline: true },
          ],
        },
      ],
    },
    {
      key: "celebrations",
      title: "Coastal Celebrations",
      fields: [
        seo,
        hero(),
        {
          kind: "group",
          key: "intro",
          label: "Intro",
          fields: [
            { kind: "text", key: "script", label: "Script title" },
            { kind: "text", key: "title", label: "Heading" },
            { kind: "text", key: "body", label: "Text", multiline: true },
          ],
        },
        heading("themes", "Themes", [
          { kind: "text", key: "body", label: "Text", multiline: true },
          { kind: "list", key: "items", label: "Themes", hint: "One per line." },
        ]),
        heading("decor", "Decor", [{ kind: "list", key: "items", label: "Decor", hint: "One per line." }]),
        heading("packages", "Party packages", []),
        cta,
      ],
    },
    {
      key: "contact",
      title: "Contact",
      fields: [
        seo,
        hero(),
        { kind: "text", key: "reachTitle", label: "Contact details label" },
        {
          kind: "group",
          key: "afterHours",
          label: "Outside normal hours",
          fields: [
            { kind: "text", key: "title", label: "Heading" },
            { kind: "text", key: "body", label: "Text", multiline: true },
          ],
        },
        { kind: "text", key: "formTitle", label: "Form heading" },
      ],
    },
  ],
};
