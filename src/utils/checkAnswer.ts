// Collator for accent-insensitive comparisons in Spanish/Polish
const collator = new Intl.Collator(["es", "pl"], {
    usage: "search",
    sensitivity: "base", // ignore accents/diacritics but keep ñ distinct from n
    ignorePunctuation: true,
});

// Normalize whitespace before comparing answers
function normalizeWhitespace(s: string) {
    return s.trim().replace(/\s+/g, " ");
}

// Compare user input to the correct answer using accent-insensitive match
export function checkAnswer(user: string, correct: string) {
    const a = normalizeWhitespace(user);
    const b = normalizeWhitespace(correct);
    return collator.compare(a, b) === 0;
}
