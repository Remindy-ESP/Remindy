export class Email {
  private readonly value: string;

  constructor(value: string) {
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
      throw new Error('Invalid email format');
    }
    this.value = value.toLowerCase();
  }

  getValue() {
    return this.value;
  }
}
