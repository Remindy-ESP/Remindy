export abstract class IEmailService {
  abstract sendPasswordResetEmail(params: {
    to: string;
    resetLink: string;
  }): Promise<void>;
}