export class LoginFailedEvent {
  constructor(
    public readonly email: string,
    public readonly reason: string,
  ) {}
}
