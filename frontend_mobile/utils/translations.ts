/**
 * Utility functions for translating status values from English to French
 */

export type EventStatus = 'scheduled' | 'completed' | 'canceled' | 'failed' | 'PENDING' | 'COMPLETED' | 'RESCHEDULED';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

/**
 * Translates an event status from English to French
 */
export function translateEventStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'scheduled': 'Planifié',
    'completed': 'Terminé',
    'canceled': 'Annulé',
    'cancelled': 'Annulé',
    'failed': 'Échoué',
    'PENDING': 'En attente',
    'COMPLETED': 'Terminé',
    'RESCHEDULED': 'Reprogrammé',
  };

  return statusMap[status] || status;
}

/**
 * Translates a payment status from English to French
 */
export function translatePaymentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'En attente',
    'paid': 'Payé',
    'failed': 'Échoué',
  };

  return statusMap[status] || status;
}

/**
 * Gets the color for an event status
 */
export function getEventStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'scheduled': '#fbbf24', // yellow
    'completed': '#4ade80', // green
    'canceled': '#9ca3af', // gray
    'cancelled': '#9ca3af', // gray
    'failed': '#f87171', // red
    'PENDING': '#fbbf24', // yellow
    'COMPLETED': '#4ade80', // green
    'RESCHEDULED': '#60a5fa', // blue
  };

  return colorMap[status] || '#9ca3af';
}

/**
 * Gets the color for a payment status
 */
export function getPaymentStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'pending': '#fbbf24', // yellow
    'paid': '#4ade80', // green
    'failed': '#f87171', // red
  };

  return colorMap[status] || '#9ca3af';
}
