const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  /**
   * Canonical form used for storage and lookups. Reads must normalize with
   * the same rule as writes, or lookups miss differently-cased input.
   */
  static normalize(raw: string): string {
    return raw.trim().toLowerCase();
  }

  static create(raw: string): Email {
    const normalized = Email.normalize(raw);
    if (!EMAIL_REGEX.test(normalized)) {
      throw new Error('InvalidEmail');
    }
    return new Email(normalized);
  }

  static reconstitute(value: string): Email {
    return new Email(value);
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
