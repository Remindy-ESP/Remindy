import { ApiProperty } from '@nestjs/swagger';
import { RoleLimit } from '../../domain/role-limit.entity';

export class RoleLimitResponseDto {
  @ApiProperty({
    description: 'Role key',
    example: 'premium',
  })
  role: string;

  @ApiProperty({
    description: 'Maximum number of subscriptions allowed',
    example: 10,
    nullable: true,
  })
  maxSubscriptions: number | null;

  @ApiProperty({
    description: 'Maximum number of documents allowed',
    example: 100,
    nullable: true,
  })
  maxDocuments: number | null;

  @ApiProperty({
    description: 'Maximum document size in MB',
    example: 10,
    nullable: true,
  })
  maxDocumentSizeMb: number | null;

  @ApiProperty({
    description: 'Maximum reminders per subscription',
    example: 50,
    nullable: true,
  })
  maxRemindersPerSubscription: number | null;

  @ApiProperty({
    description: 'Can export data',
    example: true,
  })
  canExportData: boolean;

  @ApiProperty({
    description: 'Can use OCR',
    example: true,
  })
  canUseOcr: boolean;

  @ApiProperty({
    description: 'Timestamp when the role limit was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the role limit was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  static fromDomain(roleLimit: RoleLimit): RoleLimitResponseDto {
    const dto = new RoleLimitResponseDto();
    dto.role = roleLimit.getRole();
    dto.maxSubscriptions = roleLimit.getMaxSubscriptions();
    dto.maxDocuments = roleLimit.getMaxDocuments();
    dto.maxDocumentSizeMb = roleLimit.getMaxDocumentSizeMb();
    dto.maxRemindersPerSubscription = roleLimit.getMaxRemindersPerSubscription();
    dto.canExportData = roleLimit.canExport();
    dto.canUseOcr = roleLimit.canOcr();
    dto.createdAt = roleLimit.getCreatedAt();
    dto.updatedAt = roleLimit.getUpdatedAt();
    return dto;
  }
}
