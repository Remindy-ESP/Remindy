import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { BrevoEmailService } from './sendgrid-email.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BrevoEmailService', () => {
  let service: BrevoEmailService;

  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set up environment variables used by the service
    process.env = {
      ...originalEnv,
      MAIL_FROM: 'noreply@remindy.app',
      SENDGRID_API_KEY: 'test-brevo-api-key',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BrevoEmailService],
    }).compile();

    service = module.get<BrevoEmailService>(BrevoEmailService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    const validParams = {
      to: 'user@example.com',
      resetLink: 'https://remindy.app/reset-password?token=abc123',
    };

    it('should call axios.post with correct URL and headers on success', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201, data: {} });

      await service.sendPasswordResetEmail(validParams);

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        expect.any(Object),
        expect.objectContaining({
          headers: {
            'api-key': 'test-brevo-api-key',
            'Content-Type': 'application/json',
          },
        }),
      );
    });

    it('should send to the correct recipient email address', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201, data: {} });

      await service.sendPasswordResetEmail(validParams);

      const callArgs = mockedAxios.post.mock.calls[0];
      const body = callArgs[1] as any;

      expect(body.to).toEqual([{ email: 'user@example.com' }]);
    });

    it('should send from the configured MAIL_FROM address', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201, data: {} });

      await service.sendPasswordResetEmail(validParams);

      const body = mockedAxios.post.mock.calls[0][1] as any;

      expect(body.sender).toEqual({
        email: 'noreply@remindy.app',
        name: 'Remindy',
      });
    });

    it('should include the reset link in the email HTML body', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201, data: {} });

      await service.sendPasswordResetEmail(validParams);

      const body = mockedAxios.post.mock.calls[0][1] as any;

      expect(body.htmlContent).toContain(validParams.resetLink);
    });

    it('should set the correct email subject', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201, data: {} });

      await service.sendPasswordResetEmail(validParams);

      const body = mockedAxios.post.mock.calls[0][1] as any;

      expect(body.subject).toBe('Réinitialisation de votre mot de passe');
    });

    it('should use the SENDGRID_API_KEY environment variable as the api-key header', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201, data: {} });

      await service.sendPasswordResetEmail(validParams);

      const config = mockedAxios.post.mock.calls[0][2] as any;

      expect(config.headers['api-key']).toBe('test-brevo-api-key');
    });

    it('should resolve without throwing on a successful API response', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201, data: {} });

      await expect(service.sendPasswordResetEmail(validParams)).resolves.toBeUndefined();
    });

    it('should throw and re-throw when axios.post rejects', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.post.mockRejectedValue(networkError);

      await expect(service.sendPasswordResetEmail(validParams)).rejects.toThrow('Network Error');
    });

    it('should re-throw the original error from axios', async () => {
      const axiosError = new Error('Request failed with status code 400');
      (axiosError as any).response = { data: { message: 'Invalid API key' } };
      mockedAxios.post.mockRejectedValue(axiosError);

      await expect(service.sendPasswordResetEmail(validParams)).rejects.toThrow(axiosError);
    });

    it('should re-throw even when the error has no response data', async () => {
      const connectionError = new Error('ECONNREFUSED');
      mockedAxios.post.mockRejectedValue(connectionError);

      await expect(service.sendPasswordResetEmail(validParams)).rejects.toThrow('ECONNREFUSED');
    });

    it('should send to a different recipient when called with different params', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201, data: {} });
      const otherParams = {
        to: 'another@example.com',
        resetLink: 'https://remindy.app/reset?token=xyz',
      };

      await service.sendPasswordResetEmail(otherParams);

      const body = mockedAxios.post.mock.calls[0][1] as any;
      expect(body.to).toEqual([{ email: 'another@example.com' }]);
      expect(body.htmlContent).toContain('https://remindy.app/reset?token=xyz');
    });

    it('should send to the Brevo SMTP API endpoint', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201, data: {} });

      await service.sendPasswordResetEmail(validParams);

      const url = mockedAxios.post.mock.calls[0][0];
      expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    });
  });
});
