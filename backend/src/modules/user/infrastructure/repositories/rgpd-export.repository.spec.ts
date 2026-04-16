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
    expect(ormRepository.findOne).toHaveBeenCalledWith({ where: { id: 'export-1' } });
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

    expect(ormRepository.create).toHaveBeenCalledWith({
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
    expect(ormRepository.update).toHaveBeenCalledWith({ id: 'export-1' }, { status: 'completed' });
  });

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
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = await repository.createRequest('user-1', 'csv');

    expect(ormRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      format: 'csv',
      status: 'pending',
      requestedBy: 'user',
    });
    expect(result).toBe(saved);
    logSpy.mockRestore();
  });
});
