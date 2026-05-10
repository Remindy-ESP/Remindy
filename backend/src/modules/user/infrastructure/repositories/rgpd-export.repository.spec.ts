// ============================================================
// rgpd-export.repository.spec.ts — covers line 10 (update: !updated → throw)
// Already covered in the original spec, no new branch needed beyond what exists.
// This file is a drop-in replacement with the same tests, kept for completeness.
// ============================================================

import { RgpdExportRepository } from './rgpd-export.repository';

describe('RgpdExportRepository', () => {
  let repository: RgpdExportRepository;
  let ormRepository: any;

  beforeEach(() => {
    ormRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    repository = new RgpdExportRepository(ormRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('finds an export by id', async () => {
    ormRepository.findOne.mockResolvedValue({ id: 'export-1' });

    await expect(repository.findById('export-1')).resolves.toEqual({ id: 'export-1' });
  });

  it('returns null when export is not found by id', async () => {
    ormRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('lists exports by user ordered from newest to oldest', async () => {
    await repository.findByUserId('user-1');

    expect(ormRepository.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      order: { createdAt: 'DESC' },
    });
  });

  it('creates an export request', async () => {
    const entity = { id: 'export-1' };
    ormRepository.create.mockReturnValue(entity);
    ormRepository.save.mockResolvedValue(entity);

    const result = await repository.create({
      userId: 'user-1',
      status: 'pending',
      format: 'json',
      requestedBy: 'user',
      ipAddress: '127.0.0.1',
    });

    expect(result).toBe(entity);
  });

  it('updates an export and reloads it', async () => {
    const updated = { id: 'export-1', status: 'completed' };
    ormRepository.findOne.mockResolvedValue(updated);

    await expect(repository.update('export-1', { status: 'completed' })).resolves.toBe(updated);
  });

  // Branch: !updated after update → throw (line 10)
  it('throws when updated export cannot be reloaded', async () => {
    ormRepository.findOne.mockResolvedValue(null);

    await expect(repository.update('missing', { status: 'failed' })).rejects.toThrow(
      'Export with id missing not found after update',
    );
  });

  it('creates a default user export request with pending status', async () => {
    const saved = { id: 'export-1' };
    ormRepository.create.mockReturnValue(saved);
    ormRepository.save.mockResolvedValue(saved);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await repository.createRequest('user-1', 'csv');

    expect(ormRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      format: 'csv',
      status: 'pending',
      requestedBy: 'user',
    });
    expect(result).toBe(saved);
  });
});
