import historyFile from "../public/data/history.json" with { type: "json" };
import { MODES, validNumbers } from "./math.js";

// Archivo externo independiente, NO certificado como extracto oficial.
export const ARCHIVE_META = {
  source: historyFile.source,
  retrievedAt: historyFile.retrievedAt,
  schema: historyFile.schema,
  note: "Instantánea documental no exhaustiva; se conservan fechas y modalidades sin inventar identificadores de concurso."
};
export function archiveRecords(file = historyFile) {
  if (!Array.isArray(file?.draws)) return [];
  const found = new Map();
  for (const record of file.draws) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date || "") ||
      !Number.isFinite(Date.parse(record.date+"T12:00:00Z")) ||
      !Array.isArray(record.draws) || record.draws.length !== 4 ||
      !record.draws.every(validNumbers)) continue;
    if (found.has(record.date)) continue;
    const item = { date:record.date };
    MODES.forEach((key,i) => item[key] = [...record.draws[i]].sort((a,b)=>a-b));
    found.set(record.date,item);
  }
  return [...found.values()].sort((a,b)=>b.date.localeCompare(a.date));
}
