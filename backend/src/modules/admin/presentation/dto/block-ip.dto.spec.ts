import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { BlockIpDto } from './block-ip.dto';
import { BlockReason } from 'src/infrastructure/database/entities/blocked-ip.entity';

describe('BlockIpDto', () => {
  it('accepts a permanent block without notes', () => {
    const dto = plainToInstance(BlockIpDto, {
      ipAddress: '192.168.1.10',
      reason: BlockReason.MANUAL,
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.notes).toBeUndefined();
    expect(dto.durationMinutes).toBeUndefined();
  });

  it('accepts optional notes and duration', () => {
    const dto = plainToInstance(BlockIpDto, {
      ipAddress: '10.0.0.10',
      reason: BlockReason.BRUTE_FORCE,
      notes: 'Repeated failures',
      durationMinutes: 60,
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.notes).toBe('Repeated failures');
    expect(dto.durationMinutes).toBe(60);
  });

  it('rejects invalid ip, reason and duration', () => {
    const dto = plainToInstance(BlockIpDto, {
      ipAddress: 'bad-ip',
      reason: 'oops',
      durationMinutes: 0,
    });

    const props = validateSync(dto).map(e => e.property);
    expect(props).toEqual(expect.arrayContaining(['ipAddress', 'reason', 'durationMinutes']));
  });
});
