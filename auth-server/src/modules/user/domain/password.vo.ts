export default class Password {
  private constructor(private readonly _value: string) {}
  get value(): string {
    return this._value;
  }

  static create(raw: string): Password {
    if (!raw) throw new Error('PasswordRequired');
    if (raw.length < 10) throw new Error('PasswordTooShort');
    return new Password(raw);
  }
}
