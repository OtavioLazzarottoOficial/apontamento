const DAY = 86_400_000;

export function parseProductionDate(value: string): number | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [day, month, year] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date.getTime()
    : null;
}

export function weekForDate(timestamp: number): string {
  const weekday = new Date(timestamp).getUTCDay();
  return new Date(timestamp - ((weekday + 6) % 7) * DAY)
    .toISOString()
    .slice(0, 10);
}

export function currentProductionWeek(now = new Date()): string {
  return weekForDate(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
}

export function belongsToProductionWeek(value: string, week: string): boolean {
  const timestamp = parseProductionDate(value);
  if (timestamp === null) return false;
  const day = new Date(timestamp).getUTCDay();
  return day >= 1 && day <= 5 && weekForDate(timestamp) === week;
}

export function productionWeeks(
  dates: string[],
  current = currentProductionWeek(),
): string[] {
  const weeks = new Set([current]);
  for (const date of dates) {
    const timestamp = parseProductionDate(date);
    if (
      timestamp !== null &&
      belongsToProductionWeek(date, weekForDate(timestamp))
    )
      weeks.add(weekForDate(timestamp));
  }
  return [...weeks].sort().reverse();
}

export function formatProductionWeek(week: string): string {
  const start = Date.parse(`${week}T00:00:00Z`);
  const format = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  return `${format(start)} a ${format(start + 4 * DAY)}`;
}
