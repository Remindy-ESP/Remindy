export interface ComparisonQueryAppDto {
  userId: string;
  currentStart: Date;
  currentEnd: Date;
  compareStart: Date;
  compareEnd: Date;
  categoryId?: string;
}
