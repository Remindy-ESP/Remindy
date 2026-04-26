export interface CreateCategoryAppDto {
  name: string;
  icon: string;
  color: string;
  userId?: string;
  isSystem?: boolean;
}
