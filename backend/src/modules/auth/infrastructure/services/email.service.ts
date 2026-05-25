export abstract class IEmailService {
  abstract sendPasswordResetEmail(params: { to: string; resetLink: string }): Promise<void>;
  abstract sendVerificationEmail(params: { to: string; verificationLink: string }): Promise<void>;
}
