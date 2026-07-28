/**
 * Static site content + config.
 * Everything here is placeholder scaffolding — swap it out as you two settle
 * on the real details. Centralizing it keeps the pages clean and makes it easy
 * to later move this into the database (see lib/data.ts).
 */

export interface Partner {
  firstName: string;
  lastName: string;
}

export const PARTNERS = {
  one: { firstName: "Camden", lastName: "Croy" } satisfies Partner,
  two: { firstName: "Jordan", lastName: "Stacy" } satisfies Partner,
};

export const WEDDING = {
  partners: PARTNERS,
  /** Display name used across the site, e.g. hero + metadata. */
  coupleNames: `${PARTNERS.one.firstName} & ${PARTNERS.two.firstName}`,
  /** Monogram initials for the nav / branding. */
  initials: `${PARTNERS.one.firstName[0]} & ${PARTNERS.two.firstName[0]}`,
  /** Human-readable date (no time — the day-of schedule covers times). */
  date: "October 15, 2026",
  /** Machine date used by the countdown (ceremony start). */
  dateISO: "2026-10-15T16:00:00-04:00",
  location: "Cades Cove Missionary Baptist Church · Cades Cove, TN",
  /** Public-safe location shown to everyone; exact venue is invited-only. */
  region: "Cades Cove · Great Smoky Mountains, TN",
  venueNote:
    "We'll exchange vows in the historic Cades Cove Missionary Baptist Church, tucked into the Cades Cove valley of the Great Smoky Mountains — a quiet, storied place surrounded by mountains and open meadow.",
  rsvpUrl: "https://example.com/rsvp", // TODO: real RSVP destination
};

/**
 * Valid access codes (Req 1.4). In a real build this would live server-side.
 * Codes are compared case-insensitively via lib/guest.ts.
 */
export const VALID_ACCESS_CODES: readonly string[] = ["love2026", "forever"];

export interface Photo {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

/** Gallery photos (Req 4). Empty array renders the empty state (Req 4.2). */
export const PHOTOS: Photo[] = [
  { id: "1", src: "/photos/1.jpg", alt: "Camden & Jordan" },
  { id: "2", src: "/photos/2.jpg", alt: "Camden & Jordan" },
  { id: "3", src: "/photos/3.jpg", alt: "Camden & Jordan" },
  { id: "4", src: "/photos/4.jpg", alt: "Camden & Jordan" },
  { id: "5", src: "/photos/5.jpg", alt: "Camden & Jordan" },
  { id: "6", src: "/photos/6.jpg", alt: "Camden & Jordan" },
  { id: "7", src: "/photos/7.jpg", alt: "Camden & Jordan" },
  { id: "8", src: "/photos/8.jpg", alt: "Camden & Jordan" },
  { id: "9", src: "/photos/9.jpg", alt: "Camden & Jordan" },
  { id: "10", src: "/photos/10.jpg", alt: "Camden & Jordan" },
  { id: "11", src: "/photos/11.jpg", alt: "Camden & Jordan" },
  { id: "12", src: "/photos/12.jpg", alt: "Camden & Jordan" },
  { id: "13", src: "/photos/13.jpg", alt: "Camden & Jordan" },
];

export interface RegistryItem {
  id: string;
  title: string;
  description: string;
  /** Grouping label used to organize the registry page. */
  category: string;
  /** Price in cents. Omit for open-ended contribution funds. */
  priceCents?: number;
  /** Optional external link to view or buy the item. */
  url?: string;
  /** A short personal note from the couple. */
  note?: string;
  /** Open-ended contribution funds are never "claimed" / marked off. */
  isFund?: boolean;
  /** Whether a guest has already claimed (paid for) this gift. */
  purchased?: boolean;
}

/**
 * The order categories are displayed in on the registry page. Any category not
 * listed here is appended afterward, alphabetically.
 */
export const REGISTRY_CATEGORY_ORDER: readonly string[] = [
  "The Kitchen",
  "The Bath",
  "The Bedroom",
  "Funds",
];

/**
 * Registry items (Req 5). Empty array renders the empty state (Req 5.2).
 * This doubles as the seed source (prisma/seed.ts) and the read-only fallback
 * shown if the database is unreachable. `purchased` state is authoritative in
 * the database once live.
 */
export const REGISTRY_ITEMS: RegistryItem[] = [
  // --- The Kitchen ---
  {
    id: "blender",
    title: "Blender",
    description: "For smoothies, soups, and sauces — the everyday workhorse on the counter.",
    category: "The Kitchen",
    url: "https://www.amazon.com/dp/B0GH8PVFHS",
  },
  {
    id: "cookware",
    title: "Cookware Set",
    description: "Pots and pans to cook our way through every recipe together.",
    category: "The Kitchen",
    url: "https://www.amazon.com/dp/B00008CM68",
  },
  {
    id: "ceramic-mixing-bowls",
    title: "Ceramic Mixing Bowls",
    description: "A nesting set of ceramic bowls for prepping, mixing, and serving.",
    category: "The Kitchen",
    url: "https://www.amazon.com/GBHOME-Ceramic-Mixing-Bowls-GMB159DG-3P/dp/B0FJXG3K9Y",
  },
  {
    id: "steel-mixing-bowls",
    title: "Stainless Steel Mixing Bowls",
    description: "Lightweight stainless bowls that stack away and take a beating.",
    category: "The Kitchen",
    url: "https://www.amazon.com/Cuisinart-CTG-00-SMB-Stainless-Steel-Mixing/dp/B004YZEO9K",
  },
  {
    id: "food-storage",
    title: "Glass Food Storage",
    description: "Glass containers to keep leftovers and meal-prep fresh.",
    category: "The Kitchen",
    url: "https://www.target.com/p/8pc-set-of-4-glass-food-storage-container-set-clear-figmint-8482/-/A-87707286",
  },
  {
    id: "drinkware",
    title: "Drinkware",
    description: "A set of glass tumblers for water, whiskey, and everything in between.",
    category: "The Kitchen",
    url: "https://www.target.com/p/12pc-glass-potomac-double-old-fashioned-assorted-tumbler-set-threshold-8482/-/A-82325798",
  },
  {
    id: "linen-napkins",
    title: "Linen Napkins",
    description: "European linen napkins to dress up the everyday table.",
    category: "The Kitchen",
    url: "https://www.quince.com/home/european-linen-everyday-gingham-napkins-set-of-4?color=willowleaf&size=one-size",
  },
  {
    id: "kitchen-towels",
    title: "Kitchen Towels",
    description: "A set of dish towels almost too pretty to get dirty.",
    category: "The Kitchen",
    url: "https://www.anthropologie.com/anthrohome/shop/aria-dish-towels-set-of-3?color=000",
  },
  {
    id: "whisk",
    title: "Whisk",
    description: "A good balloon whisk for eggs, batters, and sauces.",
    category: "The Kitchen",
    url: "https://www.target.com/p/9-stainless-steel-whisk-figmint/-/A-90064471",
  },
  {
    id: "spatula",
    title: "Slotted Turner",
    description: "A slotted stainless turner for eggs, fish, and pancakes.",
    category: "The Kitchen",
    url: "https://www.target.com/p/stainless-steel-slotted-fish-turner-silver-figmint-8482/-/A-87711327",
  },
  {
    id: "ladle",
    title: "Ladle",
    description: "A stainless ladle for soups, stews, and Sunday chili.",
    category: "The Kitchen",
    url: "https://www.target.com/p/stainless-steel-ladle-silver-figmint-8482/-/A-87711299",
  },
  {
    id: "baking-dishes",
    title: "Baking Dishes",
    description: "A nested set of bakers for casseroles, roasts, and desserts.",
    category: "The Kitchen",
    url: "https://www.quince.com/home/staub-nested-rectangular-bakers,-set-of-3?color=white",
  },
  {
    id: "oven-mitt",
    title: "Oven Mitt",
    description: "A striped oven mitt to save our hands and look good doing it.",
    category: "The Kitchen",
    url: "https://www.williams-sonoma.com/products/williams-sonoma-heritage-stripe-oven-mitt/",
  },
  {
    id: "grater-zester",
    title: "Grater / Zester",
    description: "A handheld grater for cheese, citrus zest, and chocolate.",
    category: "The Kitchen",
    url: "https://www.amazon.com/Rainspire-Professional-Stainless-Handheld-Chocolate/dp/B0BCWF43P6",
  },

  // --- The Bath ---
  {
    id: "bath-towels",
    title: "Bath Towels",
    description: "Soft organic cotton bath towels for our first-home bathroom.",
    category: "The Bath",
    url: "https://www.target.com/p/organic-towel-casaluna/-/A-79146618",
  },
  {
    id: "hand-towels",
    title: "Hand Towels",
    description: "A pair of organic cotton hand towels.",
    category: "The Bath",
    url: "https://www.target.com/p/2pk-organic-hand-towel-casaluna/-/A-94650131",
  },
  {
    id: "washcloths",
    title: "Washcloths",
    description: "A set of quick-dry ribbed washcloths.",
    category: "The Bath",
    url: "https://www.quince.com/home/ribbed-quick-dry-washcloth-set-of-4?color=silver&size=one-size",
  },
  {
    id: "shower-filter",
    title: "Shower Filter",
    description: "A filter for softer water and better showers.",
    category: "The Bath",
    url: "https://www.amazon.com/dp/B01MUBU0YC",
  },

  // --- The Bedroom ---
  {
    id: "sheets",
    title: "Percale Sheet Set",
    description: "Crisp organic percale sheets for slow weekend mornings.",
    category: "The Bedroom",
    url: "https://www.quince.com/home/classic-organic-percale-fitted-sheet-set?color=mist",
  },
  {
    id: "duvet-cover",
    title: "Duvet Cover",
    description: "An organic percale duvet cover in a deep navy.",
    category: "The Bedroom",
    url: "https://www.quince.com/home/classic-organic-percale-duvet-cover?color=navy",
  },
  {
    id: "throw-pillows",
    title: "Throw Pillow Covers",
    description: "Floral throw pillow covers to bring the bed to life.",
    category: "The Bedroom",
    url: "https://www.amazon.com/dp/B0DF7QQ1JY",
  },
  {
    id: "pillow-inserts",
    title: "Pillow Inserts",
    description: "Plush inserts to fill out the throw pillows.",
    category: "The Bedroom",
    url: "https://www.target.com/p/white-throw-pillow-inserts-set-of-2-by-bare-home/-/A-1001268845",
  },
  {
    id: "lamps",
    title: "Bedside Lamps",
    description: "A little wooden lamp for warm light on the nightstand.",
    category: "The Bedroom",
    url: "https://www.amazon.com/dp/B0FQ5F37RC",
  },
  {
    id: "mirror",
    title: "Full-Length Mirror",
    description: "A standing full-length mirror for the bedroom.",
    category: "The Bedroom",
    url: "https://www.amazon.com/Delma-Standing-Entryway-Bedroom-Bathroom/dp/B0D16T4G91",
  },

  // --- Funds (open-ended contribution funds) ---
  {
    id: "honeymoon-fund",
    title: "Honeymoon Fund",
    description:
      "Help send us off on our honeymoon — a night away, a good dinner, a little adventure. Every bit means the world.",
    category: "Funds",
    isFund: true,
  },
  {
    id: "house-fund",
    title: "House Fund",
    description:
      "We're saving toward our first home together. Any gift helps us plant roots.",
    category: "Funds",
    isFund: true,
    note: "Truly, your presence is more than enough — this is here only if you'd like to give.",
  },
];

/** Format a price in cents as a clean USD string, e.g. 18000 -> "$180". */
export function formatPrice(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  }).format(dollars);
}

/* ----------------------------------------------------------------------------
 * Our Story — placeholder milestones. TODO: replace with your real timeline.
 * ------------------------------------------------------------------------- */
export interface StoryImage {
  src: string;
  alt: string;
  /** Optional caption shown beneath the image in a carousel. */
  caption?: string;
}

export interface StoryMoment {
  id: string;
  label: string;
  body: string;
  /** Optional photos for this moment, rendered as a small strip. */
  images?: StoryImage[];
}

export interface StoryMilestone {
  id: string;
  date: string;
  title: string;
  body: string;
  /** Optional explicit photo; otherwise a gallery photo is chosen by position. */
  photo?: string;
  /** Optional sub-moments, rendered as a small grid for richer chapters. */
  moments?: StoryMoment[];
}

export const STORY_INTRO =
  "Placeholder for how you two met and everything since. Drop in the real story, the messy details and the good ones, and we'll shape the layout around it.";

export const STORY_MILESTONES: StoryMilestone[] = [
  {
    id: "met",
    date: "June 2023",
    title: "How we met",
    body: "Our paths first crossed in June 2023 in the 18–25 young adults group at First Baptist Concord Church.",
  },
  {
    id: "long-distance",
    date: "Aug 2023 – June 2026",
    title: "Long distance",
    body: "For almost three years, love meant time zones, airports, and always counting down to the next visit — right up until the distance finally closed for good.",
    moments: [
      {
        id: "facetime",
        label: "Thousands of FaceTime hours",
        body: "From August 2023 until Camden came home on June 20, 2026, FaceTime was our daily bridge — about an hour every morning and four or five each weekday evening, and easily eight to ten on weekends. In nearly three years we only missed a handful of days (Jordan's Madrid trip, Camden's trips to Dallas and Portland). By our rough math, that's well over 6,000 hours together on a screen — more than 250 days' worth of calls.",
        // Placeholder photos + captions — swap in real FaceTime screenshots / favorites.
        images: [
          { src: "/photos/2.jpg", alt: "Camden & Jordan", caption: "Morning call before work" },
          { src: "/photos/3.jpg", alt: "Camden & Jordan", caption: "Another late-night goodnight" },
          { src: "/photos/6.jpg", alt: "Camden & Jordan", caption: "Watching a movie \u201Ctogether\u201D" },
          { src: "/photos/8.jpg", alt: "Camden & Jordan", caption: "A weekend marathon call" },
          { src: "/photos/10.jpg", alt: "Camden & Jordan", caption: "Same sky, different cities" },
          { src: "/photos/13.jpg", alt: "Camden & Jordan", caption: "Counting down the days" },
        ],
      },
      {
        id: "visits",
        label: "Every visit we could",
        body: "Placeholder: the trips back and forth, airport pickups, and the hard goodbyes at the gate.",
        images: [
          { src: "/photos/7.jpg", alt: "Camden & Jordan", caption: "Airport arrivals" },
          { src: "/photos/11.jpg", alt: "Camden & Jordan", caption: "Making the most of every weekend" },
        ],
      },
      {
        id: "coming-home",
        label: "Coming home — June 20, 2026",
        body: "Placeholder: the day the distance finally closed for good, and everyday life together began.",
      },
    ],
  },
  {
    id: "proposal",
    date: "The question",
    title: "The proposal",
    body: "Placeholder: how the question was asked and answered.",
    photo: "/photos/14.jpg",
  },
  {
    id: "now",
    date: "Today",
    title: "What's next",
    body: "Placeholder: a line about the life you're building and the wedding to come.",
  },
];

/* ----------------------------------------------------------------------------
 * Day-of schedule — placeholder timeline. TODO: confirm real times.
 * ------------------------------------------------------------------------- */
export interface ScheduleEvent {
  id: string;
  time: string;
  title: string;
  description: string;
}

export const SCHEDULE: ScheduleEvent[] = [
  {
    id: "1",
    time: "3:30 PM",
    title: "Meet & Party Bus",
    description: "Gather at Dancing Bear Appalachian Bistro — a party bus takes us to the ceremony together.",
  },
  { id: "2", time: "4–5 PM", title: "Ceremony", description: "Cades Cove Missionary Baptist Church" },
  { id: "3", time: "5:00 PM", title: "Photos & Mingling", description: "Meadow behind the church" },
  {
    id: "4",
    time: "Evening",
    title: "Dinner & Reception",
    description: "Party bus returns to Dancing Bear Appalachian Bistro for dinner and celebrating.",
  },
  { id: "5", time: "Later", title: "Dancing", description: "Until the stars are out" },
];

/* ----------------------------------------------------------------------------
 * Venue + travel — placeholders. TODO: confirm addresses, links, and tips.
 * ------------------------------------------------------------------------- */
export const VENUE = {
  name: "Cades Cove Missionary Baptist Church",
  address: "Cades Cove Loop Rd, Townsend, TN 37882",
  mapQuery: "Cades Cove Missionary Baptist Church, Great Smoky Mountains",
  /** Photo of the church (fall) used in the invited-only details section. */
  photo: "/photos/missionary-baptist.jpeg",
  photoAlt:
    "Cades Cove Missionary Baptist Church surrounded by autumn foliage in the Great Smoky Mountains",
  parkNote:
    "Getting there is easy — two party buses will carry us from Dancing Bear Appalachian Bistro to the ceremony in Cades Cove, then back to Dancing Bear for dinner and dancing. No need to drive into the park or worry about parking; we'll share pickup times as the date nears.",
};

