export class Email {
  private readonly value: string;

  constructor(value: string) {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }

    this.value = value.toLowerCase();
  }

  getValue(): string {
    return this.value;
  }
}