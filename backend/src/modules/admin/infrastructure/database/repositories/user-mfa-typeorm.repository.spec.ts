import { UserMfaTypeOrmRepository } from './user-mfa-typeorm.repository';
import { CryptoService } from '../../services/crypto.service';

const mockUsers = {
  findOne: jest.fn(),
  update: jest.fn(),
  increment: jest.fn(),
};

const mockCrypto: jest.Mocked<Partial<CryptoService>> = {
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  isEncrypted: jest.fn(),
};

const makeRepo = () =>
  new UserMfaTypeOrmRepository(mockUsers as any, mockCrypto as any);

const makeUser = (overrides: any = {}) => ({
  id: 'user-1',
  email: 'user@test.com',
  role_key: 'user_freemium',
  mfaEnabled: false,
  mfaSecret: null,
  failedLoginCount: 0,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('UserMfaTypeOrmRepository.findByIdForMfa()', () => {
  it('calls findOne with correct params', async () => {
    const user = makeUser({ mfaEnabled: true });
    mockUsers.findOne.mockResolvedValue(user);

    const result = await makeRepo().findByIdForMfa('user-1');

    expect(mockUsers.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: ['id', 'email', 'role_key', 'mfaEnabled', 'mfaSecret'],
    });
    expect(result).toEqual(user);
  });

  it('returns null when user is not found', async () => {
    mockUsers.findOne.mockResolvedValue(null);
    const result = await makeRepo().findByIdForMfa('ghost');
    expect(result).toBeNull();
  });
});

describe('UserMfaTypeOrmRepository.setSecret()', () => {
  it('encrypts the secret and updates the user', async () => {
    mockCrypto.encrypt!.mockReturnValue('encrypted-secret');
    mockUsers.update.mockResolvedValue({});

    await makeRepo().setSecret('user-1', 'raw-secret');

    expect(mockCrypto.encrypt).toHaveBeenCalledWith('raw-secret');
    expect(mockUsers.update).toHaveBeenCalledWith({ id: 'user-1' }, { mfaSecret: 'encrypted-secret' });
  });
});

describe('UserMfaTypeOrmRepository.enable()', () => {
  it('sets mfaEnabled to true', async () => {
    mockUsers.update.mockResolvedValue({});

    await makeRepo().enable('user-1');

    expect(mockUsers.update).toHaveBeenCalledWith({ id: 'user-1' }, { mfaEnabled: true });
  });
});

describe('UserMfaTypeOrmRepository.getDecryptedSecret()', () => {
  it('returns null when user has no mfaSecret', async () => {
    mockUsers.findOne.mockResolvedValue(makeUser({ mfaSecret: null }));

    const result = await makeRepo().getDecryptedSecret('user-1');
    expect(result).toBeNull();
    expect(mockCrypto.decrypt).not.toHaveBeenCalled();
  });

  it('returns null when user is not found', async () => {
    mockUsers.findOne.mockResolvedValue(null);

    const result = await makeRepo().getDecryptedSecret('ghost');
    expect(result).toBeNull();
  });

  it('decrypts and returns the secret when mfaSecret is set', async () => {
    mockUsers.findOne.mockResolvedValue(makeUser({ mfaSecret: 'encrypted-secret' }));
    mockCrypto.decrypt!.mockReturnValue('raw-secret');

    const result = await makeRepo().getDecryptedSecret('user-1');
    expect(mockCrypto.decrypt).toHaveBeenCalledWith('encrypted-secret');
    expect(result).toBe('raw-secret');
  });
});

describe('UserMfaTypeOrmRepository.incrementFailedLogin()', () => {
  it('increments failedLoginCount by 1', async () => {
    mockUsers.increment.mockResolvedValue({});

    await makeRepo().incrementFailedLogin('user-1');

    expect(mockUsers.increment).toHaveBeenCalledWith({ id: 'user-1' }, 'failedLoginCount', 1);
  });
});

describe('UserMfaTypeOrmRepository.ensureEncryptedSecret()', () => {
  it('returns early when user has no mfaSecret', async () => {
    mockUsers.findOne.mockResolvedValue(makeUser({ mfaSecret: null }));

    await makeRepo().ensureEncryptedSecret('user-1');

    expect(mockCrypto.isEncrypted).not.toHaveBeenCalled();
    expect(mockUsers.update).not.toHaveBeenCalled();
  });

  it('returns early when user is not found', async () => {
    mockUsers.findOne.mockResolvedValue(null);

    await makeRepo().ensureEncryptedSecret('user-1');

    expect(mockCrypto.isEncrypted).not.toHaveBeenCalled();
  });

  it('does nothing when secret is already encrypted', async () => {
    mockUsers.findOne.mockResolvedValue(makeUser({ mfaSecret: 'already.encrypted.secret' }));
    mockCrypto.isEncrypted!.mockReturnValue(true);

    await makeRepo().ensureEncryptedSecret('user-1');

    expect(mockCrypto.encrypt).not.toHaveBeenCalled();
    expect(mockUsers.update).not.toHaveBeenCalled();
  });

  it('encrypts and updates when secret is not encrypted', async () => {
    mockUsers.findOne.mockResolvedValue(makeUser({ mfaSecret: 'plain-secret' }));
    mockCrypto.isEncrypted!.mockReturnValue(false);
    mockCrypto.encrypt!.mockReturnValue('now.encrypted.secret');
    mockUsers.update.mockResolvedValue({});

    await makeRepo().ensureEncryptedSecret('user-1');

    expect(mockCrypto.encrypt).toHaveBeenCalledWith('plain-secret');
    expect(mockUsers.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { mfaSecret: 'now.encrypted.secret' },
    );
  });
});

describe('UserMfaTypeOrmRepository.resetFailedLogin()', () => {
  it('sets failedLoginCount to 0', async () => {
    mockUsers.update.mockResolvedValue({});

    await makeRepo().resetFailedLogin('user-1');

    expect(mockUsers.update).toHaveBeenCalledWith({ id: 'user-1' }, { failedLoginCount: 0 });
  });
});
