import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudflareR2Service } from '../cloudflare-r2.service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('CloudflareR2Service', () => {
  let service: CloudflareR2Service;
  let mockS3Client: jest.Mocked<S3Client>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          R2_ACCOUNT_ID: 'test-account-id',
          R2_ACCESS_KEY_ID: 'test-access-key',
          R2_SECRET_ACCESS_KEY: 'test-secret-key',
          R2_BUCKET_NAME: 'test-bucket',
          R2_PUBLIC_URL: 'https://cdn.example.com',
        };
        return config[key];
      }),
    };

    mockS3Client = {
      send: jest.fn(),
    } as any;

    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(() => mockS3Client);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudflareR2Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CloudflareR2Service>(CloudflareR2Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const fileBuffer = Buffer.from('test file content');
      const key = 'users/123/documents/test.pdf';
      const mimeType = 'application/pdf';

      (mockS3Client.send as jest.Mock).mockResolvedValueOnce({});

      const result = await service.uploadFile(fileBuffer, key, mimeType);

      expect(result).toBe('https://cdn.example.com/users/123/documents/test.pdf');
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('should throw error when upload fails', async () => {
      const fileBuffer = Buffer.from('test content');
      const key = 'test-key';
      const mimeType = 'application/pdf';

      (mockS3Client.send as jest.Mock).mockRejectedValueOnce(new Error('S3 upload failed'));

      await expect(service.uploadFile(fileBuffer, key, mimeType)).rejects.toThrow(
        'Failed to upload file to R2',
      );
    });
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const key = 'test-key';
      const mockBody = {
        *[Symbol.asyncIterator]() {
          yield Buffer.from('test content');
        },
      };

      (mockS3Client.send as jest.Mock).mockResolvedValueOnce({ Body: mockBody });

      const result = await service.downloadFile(key);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('test content');
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    });

    it('should throw error when download fails', async () => {
      const key = 'test-key';

      (mockS3Client.send as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

      await expect(service.downloadFile(key)).rejects.toThrow('Failed to download file from R2');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const key = 'test-key';

      (mockS3Client.send as jest.Mock).mockResolvedValueOnce({});

      await service.deleteFile(key);

      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('should throw error when delete fails', async () => {
      const key = 'test-key';

      (mockS3Client.send as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));

      await expect(service.deleteFile(key)).rejects.toThrow('Failed to delete file from R2');
    });
  });

  describe('uploadFile - without publicUrl', () => {
    it('should use signed URL when no public URL is configured', async () => {
      // Create a service instance without a public URL
      const { getSignedUrl } = jest.requireMock('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockResolvedValueOnce('https://signed-url.example.com/file');

      const mockConfigServiceNoPublicUrl = {
        get: jest.fn((key: string) => {
          const config: Record<string, any> = {
            R2_ACCOUNT_ID: 'test-account-id',
            R2_ACCESS_KEY_ID: 'test-access-key',
            R2_SECRET_ACCESS_KEY: 'test-secret-key',
            R2_BUCKET_NAME: 'test-bucket',
            R2_PUBLIC_URL: '', // empty
          };
          return config[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CloudflareR2Service,
          { provide: ConfigService, useValue: mockConfigServiceNoPublicUrl },
        ],
      }).compile();

      const serviceNoPublicUrl = module.get<CloudflareR2Service>(CloudflareR2Service);

      (mockS3Client.send as jest.Mock).mockResolvedValueOnce({});

      const result = await serviceNoPublicUrl.uploadFile(
        Buffer.from('test'),
        'test-key',
        'application/pdf',
      );

      expect(result).toBe('https://signed-url.example.com/file');
    });
  });

  describe('getSignedUrl', () => {
    it('should generate a signed URL', async () => {
      const { getSignedUrl } = jest.requireMock('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockResolvedValueOnce('https://signed.example.com/key?sig=abc');

      const result = await service.getSignedUrl('test-key');

      expect(result).toBe('https://signed.example.com/key?sig=abc');
    });

    it('should throw error when signed URL generation fails', async () => {
      const { getSignedUrl } = jest.requireMock('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockRejectedValueOnce(new Error('Signing failed'));

      await expect(service.getSignedUrl('test-key')).rejects.toThrow(
        'Failed to generate signed URL',
      );
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      (mockS3Client.send as jest.Mock).mockResolvedValueOnce({ Body: {} });

      const result = await service.fileExists('test-key');

      expect(result).toBe(true);
    });

    it('should return false when file does not exist (NoSuchKey)', async () => {
      const error = new Error('Not found');
      (error as any).name = 'NoSuchKey';
      (mockS3Client.send as jest.Mock).mockRejectedValueOnce(error);

      const result = await service.fileExists('test-key');

      expect(result).toBe(false);
    });

    it('should rethrow non-NoSuchKey errors', async () => {
      const error = new Error('Access denied');
      (error as any).name = 'AccessDenied';
      (mockS3Client.send as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.fileExists('test-key')).rejects.toThrow('Access denied');
    });
  });

  describe('getFileMetadata', () => {
    it('should return file metadata', async () => {
      const lastModified = new Date('2025-01-01');
      (mockS3Client.send as jest.Mock).mockResolvedValueOnce({
        ContentLength: 1024,
        ContentType: 'application/pdf',
        LastModified: lastModified,
        Body: {},
      });

      const result = await service.getFileMetadata('test-key');

      expect(result.size).toBe(1024);
      expect(result.contentType).toBe('application/pdf');
      expect(result.lastModified).toEqual(lastModified);
    });

    it('should use defaults when metadata fields are missing', async () => {
      (mockS3Client.send as jest.Mock).mockResolvedValueOnce({
        Body: {},
        // No ContentLength, ContentType, LastModified
      });

      const result = await service.getFileMetadata('test-key');

      expect(result.size).toBe(0);
      expect(result.contentType).toBe('application/octet-stream');
      expect(result.lastModified).toBeInstanceOf(Date);
    });

    it('should throw error when metadata retrieval fails', async () => {
      (mockS3Client.send as jest.Mock).mockRejectedValueOnce(new Error('Not found'));

      await expect(service.getFileMetadata('missing-key')).rejects.toThrow(
        'Failed to get file metadata',
      );
    });
  });

  describe('initialization error', () => {
    it('should throw when R2 credentials are not configured', () => {
      const mockConfigServiceMissing = {
        get: jest.fn((key: string, defaultVal?: any) => {
          if (key === 'R2_BUCKET_NAME') return defaultVal ?? 'remindy-documents';
          if (key === 'R2_PUBLIC_URL') return defaultVal ?? '';
          return undefined; // missing credentials
        }),
      };

      expect(() => new CloudflareR2Service(mockConfigServiceMissing as any)).toThrow(
        'Cloudflare R2 credentials are not configured in .env',
      );
    });
  });
});
