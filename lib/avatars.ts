const SEEDS = [
  "Felix", "Anita", "Oliver", "Maya", "Leo", 
  "Zara", "Ethan", "Nina", "Oscar", "Luna",
  "Max", "Chloe", "Sam", "Ruby", "Lucas",
  "Mia", "Hugo", "Stella", "Jack", "Lily",
  "Noah", "Ava", "Finn", "Zoe", "Levi",
  "Cleo", "Milo", "Ivy", "Eli", "Nova"
];

// Use Dicebear's "notionists" style which perfectly replicates the Notion faces look
export const NOTION_FACES = SEEDS.map(
  (seed) => `https://api.dicebear.com/7.x/notionists/png?seed=${seed}&size=128&backgroundColor=f1f5f9`
);

export function getRandomFace(): string {
  const index = Math.floor(Math.random() * NOTION_FACES.length);
  return NOTION_FACES[index];
}

export function getFaceFor(id: string): string {
  // Deterministic random face based on string
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % NOTION_FACES.length;
  return NOTION_FACES[index];
}
