const WORDS_FOR_MOOD: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: "😊", label: "Happy" },
  joy: { emoji: "🎉", label: "Joyful" },
  excited: { emoji: "🤩", label: "Excited" },
  grateful: { emoji: "🙏", label: "Grateful" },
  love: { emoji: "❤️", label: "Loving" },
  proud: { emoji: "🌟", label: "Proud" },
  hopeful: { emoji: "✨", label: "Hopeful" },
  inspired: { emoji: "💡", label: "Inspired" },
  anxious: { emoji: "😰", label: "Anxious" },
  worried: { emoji: "😟", label: "Worried" },
  stressed: { emoji: "😤", label: "Stressed" },
  sad: { emoji: "😢", label: "Sad" },
  tired: { emoji: "😴", label: "Tired" },
  angry: { emoji: "😠", label: "Angry" },
  frustrated: { emoji: "😩", label: "Frustrated" },
  calm: { emoji: "🫂", label: "Calm" },
  content: { emoji: "😌", label: "Content" },
  confused: { emoji: "🤔", label: "Confused" },
  lonely: { emoji: "🥺", label: "Lonely" },
  motivated: { emoji: "🔥", label: "Motivated" },
  curious: { emoji: "🧐", label: "Curious" },
};

const WORDS_TOPICS = [
  "work", "career", "job", "meeting", "project", "boss", "colleague", "team",
  "family", "mom", "dad", "sister", "brother", "parent", "child", "partner",
  "health", "doctor", "sick", "exercise", "gym", "meditation", "sleep", "food",
  "money", "finance", "budget", "bills", "invest", "saving",
  "travel", "trip", "vacation", "holiday", "flight", "hotel",
  "friend", "party", "date", "social", "weekend", "fun",
  "goal", "dream", "plan", "habit", "routine", "learning", "skill",
  "grateful", "thankful", "blessing", "appreciation",
  "worry", "fear", "struggle", "stress", "overwhelm",
  "idea", "creative", "invention", "discovery", "insight",
];

export function inferMood(text: string): { emoji: string; label: string } {
  const lower = text.toLowerCase();
  for (const [keyword, mood] of Object.entries(WORDS_FOR_MOOD)) {
    if (lower.includes(keyword)) return mood;
  }
  return { emoji: "📝", label: "Reflective" };
}

export function inferTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  const categories: Record<string, string[]> = {
    Work: ["work", "career", "job", "meeting", "project", "boss", "colleague", "team"],
    Family: ["family", "mom", "dad", "sister", "brother", "parent", "child", "partner", "home"],
    Health: ["health", "doctor", "sick", "exercise", "gym", "meditation", "sleep", "food", "run"],
    Finance: ["money", "finance", "budget", "bills", "invest", "saving", "purchase", "buy"],
    Travel: ["travel", "trip", "vacation", "holiday", "flight", "hotel", "visit"],
    Social: ["friend", "party", "date", "social", "weekend", "fun", "call"],
    Goals: ["goal", "dream", "plan", "habit", "routine", "learning", "skill", "growth"],
    Creativity: ["idea", "creative", "invention", "discovery", "insight", "write"],
  };
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => lower.includes(kw))) found.add(category);
  }
  return Array.from(found).slice(0, 3);
}

export function inferTitle(text: string): string {
  const lines = text.split(/[.!?\n]+/).filter(Boolean);
  const first = lines[0]?.trim();
  if (first && first.length > 0) {
    const clean = first.length > 60 ? first.slice(0, 57) + "..." : first;
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return "Untitled entry";
}

export function inferPeople(text: string): string[] {
  // Simple noun-phrase heuristic: words after "with", "and", "called"
  const lower = text.toLowerCase();
  const names: string[] = [];
  const patterns = [
    /(?:with|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    /(?:saw|met|visited)\s+([A-Z][a-z]+)/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (!names.includes(match[1])) names.push(match[1]);
    }
  }
  return names.slice(0, 3);
}

export function inferActionItems(text: string): string[] {
  const lower = text.toLowerCase();
  const items: string[] = [];
  const patterns = [
    /(?:need to|have to|must|should|will|going to)\s+(.+?)(?:\.|,|$| and | so )/gi,
    /(?:remind me to|don't forget to|remember to)\s+(.+?)(?:\.|,|$)/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1].trim();
      if (item.length > 5 && !items.includes(item)) items.push(item);
    }
  }
  return items.slice(0, 5);
}

export function inferKeyIdeas(text: string): string[] {
  const lines = text.split(/[.!?\n]+/).filter((l) => l.trim().length > 20);
  return lines.slice(0, 3).map((l) => l.trim());
}
