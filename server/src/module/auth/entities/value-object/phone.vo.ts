export class Phone {
  private readonly value: string;

  constructor(value: string) {
    const cleaned = value.replace(/\s+/g, '');

    if (!/^(\+?[0-9]{10,15})$/.test(cleaned)) {
      throw new Error('Invalid phone number format');
    }

    this.value = cleaned;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }
}
