export interface MonthlyReportData {
  userName: string;
  month: string;
  totalExpenses: number;
  previousTotalExpenses: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  categorySummary: { name: string; total: number }[];
  topCategory: { name: string; total: number } | null;
  activeSubscriptionsCount: number;
  currency: string;
}

export abstract class IEmailService {
  abstract sendPasswordResetEmail(params: { to: string; resetLink: string }): Promise<void>;
  abstract sendVerificationEmail(params: { to: string; verificationLink: string }): Promise<void>;
  abstract sendMonthlyReport(params: { to: string; data: MonthlyReportData }): Promise<void>;
}
