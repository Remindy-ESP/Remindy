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

      mockS3Client.send.mockResolvedValueOnce({});

      const result = await service.uploadFile(fileBuffer, key, mimeType);

      expect(result).toBe('https://cdn.example.com/users/123/documents/test.pdf');
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('should throw error when upload fails', async () => {
      const fileBuffer = Buffer.from('test content');
      const key = 'test-key';
      const mimeType = 'application/pdf';

      mockS3Client.send.mockRejectedValueOnce(new Error('S3 upload failed'));

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

      mockS3Client.send.mockResolvedValueOnce({ Body: mockBody });

      const result = await service.downloadFile(key);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('test content');
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    });

    it('should throw error when download fails', async () => {
      const key = 'test-key';

      mockS3Client.send.mockRejectedValueOnce(new Error('File not found'));

      await expect(service.downloadFile(key)).rejects.toThrow('Failed to download file from R2');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const key = 'test-key';

      mockS3Client.send.mockResolvedValueOnce({});

      await service.deleteFile(key);

      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });
  });
});
