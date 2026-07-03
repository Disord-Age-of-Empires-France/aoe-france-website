export interface Level {
  name:    string;
  min:     number;
  color:   string;
  bgColor: string;
}

export const LEVELS: Level[] = [
  { name: "Novice",     min: 0,    color: "text-gray-400",   bgColor: "bg-gray-500/15"   },
  { name: "Apprenti",   min: 50,   color: "text-green-400",  bgColor: "bg-green-500/15"  },
  { name: "Guerrier",   min: 200,  color: "text-blue-400",   bgColor: "bg-blue-500/15"   },
  { name: "Vétéran",    min: 500,  color: "text-purple-400", bgColor: "bg-purple-500/15" },
  { name: "Légendaire", min: 1000, color: "text-amber-400",  bgColor: "bg-amber-500/15"  },
];

export function computeXP(topics: number, replies: number, reactionsReceived: number): number {
  return topics * 5 + replies * 2 + reactionsReceived;
}

export function getLevel(xp: number): Level {
  return [...LEVELS].reverse().find((l) => xp >= l.min) ?? LEVELS[0];
}

export function getNextLevel(xp: number): Level | null {
  const current = getLevel(xp);
  const idx = LEVELS.indexOf(current);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}
