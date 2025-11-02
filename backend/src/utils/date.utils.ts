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
