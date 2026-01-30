export class Email {
  private readonly value: string;

  constructor(value: string) {
    const trimmed = value.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new Error('Invalid email format');
    }

    this.value = trimmed;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
