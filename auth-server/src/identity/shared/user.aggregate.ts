import { Email } from './email.vo.js';

export class User {
  private constructor(
    private readonly _id: string,
    private readonly _email: Email,
    private _passwordHash: string,
    private _isEmailVerified: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static register(id: string, email: string, passwordHash: string): User {
    const emailVo = Email.create(email);
    const now = new Date();
    return new User(id, emailVo, passwordHash, false, now, now);
  }

  static reconstitute(props: {
    id: string;
    email: string;
    passwordHash: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      props.id,
      Email.reconstitute(props.email),
      props.passwordHash,
      props.isEmailVerified,
      props.createdAt,
      props.updatedAt,
    );
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email.value;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get isEmailVerified(): boolean {
    return this._isEmailVerified;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  verifyEmail(): void {
    this._isEmailVerified = true;
    this._updatedAt = new Date();
  }

  changePassword(newHashedPassword: string): void {
    this._passwordHash = newHashedPassword;
    this._updatedAt = new Date();
  }
}
