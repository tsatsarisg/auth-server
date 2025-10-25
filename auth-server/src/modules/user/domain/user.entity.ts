export default class User {
  private readonly _id: string;
  private readonly _email: string;
  private readonly _passwordHash: string;

  constructor(id: string, email: string, passwordHash: string) {
    this._id = id;
    this._email = email;
    this._passwordHash = passwordHash;
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }
}
