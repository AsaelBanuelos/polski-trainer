// Return a uniformly random item from the array
export function pickRandom<T>(items: T[]): T {
    const idx = Math.floor(Math.random() * items.length);
    return items[idx];
}
