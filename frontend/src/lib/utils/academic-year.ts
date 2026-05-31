export function currentAcademicYear(now: Date = new Date()): string {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 9) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}
