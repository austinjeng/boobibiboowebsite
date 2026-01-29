// Tag system types and constants for Explore Bingo Map

export const HAPPY_TAGS = [
  "vibe_good",
  "dessert_surprise",
  "friendly_service",
  "good_for_chat",
  "quiet",
  "photogenic",
  "great_view",
  "good_value",
  "healing",
  "want_revisit",
] as const;

export const CAUTION_TAGS = [
  "noisy",
  "long_queue",
  "min_charge",
  "crowded",
  "slow_service",
  "hard_to_reach",
  "few_seats",
  "pricey",
] as const;

export const CONTEXT_TAGS = [
  "date",
  "family",
  "work",
  "solo",
  "friends",
] as const;

export type HappyTag = (typeof HAPPY_TAGS)[number];
export type CautionTag = (typeof CAUTION_TAGS)[number];
export type ContextTag = (typeof CONTEXT_TAGS)[number];

// Chinese display labels
export const HAPPY_TAG_LABELS: Record<HappyTag, string> = {
  vibe_good: "氣氛很棒",
  dessert_surprise: "甜點驚喜",
  friendly_service: "服務親切",
  good_for_chat: "適合聊天",
  quiet: "安靜舒適",
  photogenic: "很好拍照",
  great_view: "景色優美",
  good_value: "CP值高",
  healing: "療癒放鬆",
  want_revisit: "想再去",
};

export const CAUTION_TAG_LABELS: Record<CautionTag, string> = {
  noisy: "較吵雜",
  long_queue: "要排隊",
  min_charge: "有低消",
  crowded: "人多擁擠",
  slow_service: "出餐慢",
  hard_to_reach: "交通不便",
  few_seats: "座位少",
  pricey: "價格偏高",
};

export const CONTEXT_TAG_LABELS: Record<ContextTag, string> = {
  date: "約會",
  family: "家庭",
  work: "工作",
  solo: "獨自",
  friends: "朋友",
};

// UI helper functions
export function getHappyTagLabel(tag: HappyTag): string {
  return HAPPY_TAG_LABELS[tag];
}

export function getCautionTagLabel(tag: CautionTag): string {
  return CAUTION_TAG_LABELS[tag];
}

export function getContextTagLabel(tag: ContextTag): string {
  return CONTEXT_TAG_LABELS[tag];
}

// Validation helpers
export function isValidHappyTag(tag: string): tag is HappyTag {
  return HAPPY_TAGS.includes(tag as HappyTag);
}

export function isValidCautionTag(tag: string): tag is CautionTag {
  return CAUTION_TAGS.includes(tag as CautionTag);
}

export function isValidContextTag(tag: string): tag is ContextTag {
  return CONTEXT_TAGS.includes(tag as ContextTag);
}

// Tag colors for UI (happiness-first design - bright, positive colors for happy tags)
export const HAPPY_TAG_COLORS: Record<HappyTag, { bg: string; text: string }> = {
  vibe_good: { bg: "bg-amber-100", text: "text-amber-800" },
  dessert_surprise: { bg: "bg-pink-100", text: "text-pink-800" },
  friendly_service: { bg: "bg-green-100", text: "text-green-800" },
  good_for_chat: { bg: "bg-blue-100", text: "text-blue-800" },
  quiet: { bg: "bg-purple-100", text: "text-purple-800" },
  photogenic: { bg: "bg-rose-100", text: "text-rose-800" },
  great_view: { bg: "bg-sky-100", text: "text-sky-800" },
  good_value: { bg: "bg-emerald-100", text: "text-emerald-800" },
  healing: { bg: "bg-teal-100", text: "text-teal-800" },
  want_revisit: { bg: "bg-orange-100", text: "text-orange-800" },
};

export const CAUTION_TAG_COLORS: Record<CautionTag, { bg: string; text: string }> = {
  noisy: { bg: "bg-neutral-100", text: "text-neutral-600" },
  long_queue: { bg: "bg-neutral-100", text: "text-neutral-600" },
  min_charge: { bg: "bg-neutral-100", text: "text-neutral-600" },
  crowded: { bg: "bg-neutral-100", text: "text-neutral-600" },
  slow_service: { bg: "bg-neutral-100", text: "text-neutral-600" },
  hard_to_reach: { bg: "bg-neutral-100", text: "text-neutral-600" },
  few_seats: { bg: "bg-neutral-100", text: "text-neutral-600" },
  pricey: { bg: "bg-neutral-100", text: "text-neutral-600" },
};

export const CONTEXT_TAG_COLORS: Record<ContextTag, { bg: string; text: string }> = {
  date: { bg: "bg-red-50", text: "text-red-700" },
  family: { bg: "bg-yellow-50", text: "text-yellow-700" },
  work: { bg: "bg-slate-50", text: "text-slate-700" },
  solo: { bg: "bg-indigo-50", text: "text-indigo-700" },
  friends: { bg: "bg-cyan-50", text: "text-cyan-700" },
};
