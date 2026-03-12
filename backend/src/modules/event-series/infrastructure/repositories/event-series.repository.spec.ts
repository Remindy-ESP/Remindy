import { Repository } from 'typeorm';
import { EventSeriesRepository } from './event-series.repository';
import { EventSeriesEntity } from '../persistence/event-series.entity';
import { EventSeriesMapper } from '../mappers/event-series.mapper';
import { EventSeries } from '../../domain/event-series.entity';

jest.mock('../mappers/event-series.mapper');

function makeDomain(overrides = {}): EventSeries {
  return new EventSeries({
    id: 'series-1',
    subscriptionId: 'sub-1',
    rrule: 'FREQ=MONTHLY;INTERVAL=1',
    dtstart: new Date('2025-01-01'),
    timezone: 'Europe/Paris',
    ...overrides,
  });
}

function makeEntity(overrides = {}): EventSeriesEntity {
  return Object.assign(new EventSeriesEntity(), {
    id: 'series-1',
    subscriptionId: 'sub-1',
    rrule: 'FREQ=MONTHLY;INTERVAL=1',
    dtstart: new Date('2025-01-01'),
    timezone: 'Europe/Paris',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('EventSeriesRepository', () => {
  let sut: EventSeriesRepository;
  let repo: jest.Mocked<Partial<Repository<EventSeriesEntity>>>;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };
    sut = new EventSeriesRepository(repo as Repository<EventSeriesEntity>);
  });

  describe('create', () => {
    it('maps to persistence, saves, and maps back to domain', async () => {
      const domain = makeDomain();
      const entity = makeEntity();
      const savedEntity = makeEntity({ id: 'new-series' });
      const savedDomain = makeDomain({ id: 'new-series' });

      (EventSeriesMapper.toPersistence as jest.Mock).mockReturnValue(entity);
      (repo.save as jest.Mock).mockResolvedValue(savedEntity);
      (EventSeriesMapper.toDomain as jest.Mock).mockReturnValue(savedDomain);

      const result = await sut.create(domain);

      expect(EventSeriesMapper.toPersistence).toHaveBeenCalledWith(domain);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(savedDomain);
    });
  });

  describe('findById', () => {
    it('returns domain when found', async () => {
      const entity = makeEntity();
      const domain = makeDomain();
      (repo.findOne as jest.Mock).mockResolvedValue(entity);
      (EventSeriesMapper.toDomain as jest.Mock).mockReturnValue(domain);

      const result = await sut.findById('series-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'series-1' } });
      expect(result).toBe(domain);
    });

    it('returns null when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await sut.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('findBySubscriptionId', () => {
    it('returns domain when found', async () => {
      const entity = makeEntity();
      const domain = makeDomain();
      (repo.findOne as jest.Mock).mockResolvedValue(entity);
      (EventSeriesMapper.toDomain as jest.Mock).mockReturnValue(domain);

      const result = await sut.findBySubscriptionId('sub-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { subscriptionId: 'sub-1' } });
      expect(result).toBe(domain);
    });

    it('returns null when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await sut.findBySubscriptionId('missing-sub');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates and returns domain when found', async () => {
      const domain = makeDomain();
      const existing = makeEntity();
      const updatedEntity = makeEntity({ rrule: 'FREQ=WEEKLY;INTERVAL=1' });
      const updatedDomain = makeDomain({ rrule: 'FREQ=WEEKLY;INTERVAL=1' });

      (repo.findOne as jest.Mock).mockResolvedValue(existing);
      (EventSeriesMapper.toPersistence as jest.Mock).mockReturnValue(makeEntity());
      (repo.save as jest.Mock).mockResolvedValue(updatedEntity);
      (EventSeriesMapper.toDomain as jest.Mock).mockReturnValue(updatedDomain);

      const result = await sut.update('series-1', domain);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'series-1' } });
      expect(result).toBe(updatedDomain);
    });

    it('returns null when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await sut.update('missing', makeDomain());
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('returns true when affected > 0', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: 1 });
      expect(await sut.delete('series-1')).toBe(true);
    });

    it('returns false when affected is 0', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: 0 });
      expect(await sut.delete('series-1')).toBe(false);
    });

    it('returns false when affected is null', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: null });
      expect(await sut.delete('series-1')).toBe(false);
    });

    it('returns false when affected is undefined', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: undefined });
      expect(await sut.delete('series-1')).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('returns true when affected > 0', async () => {
      (repo.softDelete as jest.Mock).mockResolvedValue({ affected: 1 });
      expect(await sut.softDelete('series-1')).toBe(true);
    });

    it('returns false when affected is 0', async () => {
      (repo.softDelete as jest.Mock).mockResolvedValue({ affected: 0 });
      expect(await sut.softDelete('series-1')).toBe(false);
    });

    it('returns false when affected is null', async () => {
      (repo.softDelete as jest.Mock).mockResolvedValue({ affected: null });
      expect(await sut.softDelete('series-1')).toBe(false);
    });

    it('returns false when affected is undefined', async () => {
      (repo.softDelete as jest.Mock).mockResolvedValue({ affected: undefined });
      expect(await sut.softDelete('series-1')).toBe(false);
    });
  });
});
