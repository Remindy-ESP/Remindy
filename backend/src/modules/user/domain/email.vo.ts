/**
 * Email Value Object
 * Encapsule la validation et la logique métier de l'email
 */
export class Email {
  private readonly value: string;

  constructor(email: string) {
    this.validate(email);
    this.value = email.toLowerCase().trim();
  }

  private validate(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    // Regex email basique mais robuste
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Emails temporaires interdits (liste de base, extensible)
    const tempEmailDomains = ['tempmail.com', 'throwaway.email', '10minutemail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && tempEmailDomains.includes(domain)) {
      throw new Error('Temporary email addresses are not allowed');
    }

    // Longueur max
    if (email.length > 255) {
      throw new Error('Email is too long');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
