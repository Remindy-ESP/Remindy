import { EMAIL_REGEX } from 'src/utils/regex';

export class Email {
  private readonly value: string;

  constructor(value: string) {
    if (!EMAIL_REGEX.test(value)) {
      throw new Error('Invalid email format');
    }

    this.value = value.toLowerCase();
  }

  getValue(): string {
    return this.value;
  }
}
