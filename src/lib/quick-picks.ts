export const MAX_PICKS = 20;
export const MAX_PICK_LENGTH = 80;

export function parsePicks(text: string) {
  const seen = new Set<string>();
  const picks: string[] = [];
  for (const line of text.split("\n")) {
    const pick = line.trim().slice(0, MAX_PICK_LENGTH);
    const key = pick.toLowerCase();
    if (!pick || seen.has(key)) continue;
    seen.add(key);
    picks.push(pick);
    if (picks.length === MAX_PICKS) break;
  }
  return picks;
}

export function appendPick(current: string, pick: string) {
  const text = current.trimEnd();
  if (!text) return pick;
  const present = text.split(/[,\n]/).some((part) => part.trim().toLowerCase() === pick.toLowerCase());
  return present ? current : `${text}, ${pick}`;
}
