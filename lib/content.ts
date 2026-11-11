export const PLATFORMS = ["LinkedIn", "X", "Instagram", "Threads", "TikTok", "YouTube"] as const;
export type Platform = (typeof PLATFORMS)[number];
const projectNames: Record<string, string> = { sod: "SØD", orbita: "Órbita", kadmontech: "Kadmontech", personal: "mi trabajo" };
const compact = (value: string, max: number) => { const clean = value.replace(/\s+/g, " ").trim(); return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}…`; };
const firstSentence = (value: string) => compact(value.split(/(?<=[.!?])\s+/)[0] || value, 150);

export function generateVariant(platform: Platform, raw: string, project: string) {
  const clean = raw.trim(); const hook = firstSentence(clean); const projectName = projectNames[project] || "este proyecto";
  switch (platform) {
    case "LinkedIn": return `${clean}\n\nLo documento ahora, mientras construimos ${projectName}, porque el proceso real explica más que cualquier relato armado después.\n\n¿Qué parte de este proceso te gustaría ver con más detalle?`;
    case "X": return compact(clean, 275);
    case "Instagram": return `Un momento real construyendo ${projectName}.\n\n${clean}\n\nEl trabajo también está en registrar el proceso mientras sucede.`;
    case "Threads": return `Estoy documentando esto antes de que se pierda:\n\n${clean}\n\nDespués veremos en qué publicación termina. Por ahora, lo importante era capturarlo.`;
    case "TikTok": return `HOOK\n${hook}\n\nGUION\n${clean}\n\nCIERRE\nEsto es parte de lo que estamos construyendo en ${projectName}.`;
    case "YouTube": return `TÍTULO\n${hook}\n\nAPERTURA\n${clean}\n\nESTRUCTURA\n1. Qué pasó\n2. Qué decisión tomamos\n3. Qué aprendimos\n4. Qué sigue`;
  }
}

export function recommendedPlatforms(raw: string): Platform[] {
  const value = raw.toLowerCase(); const result: Platform[] = ["LinkedIn", "X", "Threads"];
  if (/foto|imagen|evento|reuni[oó]n|equipo|viaje|escena/.test(value)) result.push("Instagram");
  if (/demo|video|mostrar|explicar|proceso|producto|automat/.test(value)) result.push("TikTok");
  if (raw.length > 900 || /charla|entrevista|tutorial|profund/.test(value)) result.push("YouTube");
  return result;
}
