/**
 * Check if a trial period is still active based on the trial end date
 * @param trialEndDate - The end date of the trial period
 * @returns true if the trial is still active, false otherwise
 */
export function isTrialActive(trialEndDate?: Date | null): boolean {
  if (!trialEndDate) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trialEnd = new Date(trialEndDate);
  trialEnd.setHours(0, 0, 0, 0);
  return trialEnd >= today;
}

/**
 * Ajoute des jours à une date en préservant l'heure UTC (évite les problèmes DST)
 * @param date
 * @param days
 * @returns Nouvelle date avec les jours ajoutés
 */
export function addDaysUTC(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * @param date - La date de départ
 * @param months - Nombre de mois à ajouter
 * @returns Nouvelle date avec les mois ajoutés
 */
export function addMonthsUTC(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getUTCMonth() + months;
  const originalDay = result.getUTCDate();

  result.setUTCMonth(targetMonth);

  // Gérer le cas où le jour dépasse le nombre de jours du mois cible
  if (result.getUTCDate() !== originalDay) {
    // Revenir au dernier jour du mois précédent
    result.setUTCDate(0);
  }

  return result;
}

/**
 * Ajoute des années à une date en préservant l'heure UTC
 * @param date - La date de départ
 * @param years - Nombre d'années à ajouter
 * @returns Nouvelle date avec les années ajoutées
 */
export function addYearsUTC(date: Date, years: number): Date {
  const result = new Date(date);
  const originalDay = result.getUTCDate();

  result.setUTCFullYear(result.getUTCFullYear() + years);

  // Gérer le cas du 29 février sur une année non bissextile
  if (result.getUTCDate() !== originalDay) {
    result.setUTCDate(0);
  }

  return result;
}

/**
 * Utile pour normaliser les dates et éviter les problèmes de timezone
 * @param date - La date à normaliser
 * @returns Date à minuit UTC
 */
export function toUTCMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}

/**
 * Compare deux dates en ignorant l'heure (compare uniquement les jours en UTC)
 * @param date1 - Première date
 * @param date2 - Deuxième date
 * @returns true si les dates sont le même jour UTC
 */
export function isSameUTCDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * Retourne la date formatée en ISO string (YYYY-MM-DD) en UTC
 * @param date - La date à formater
 * @returns String au format YYYY-MM-DD
 */
export function toUTCDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
