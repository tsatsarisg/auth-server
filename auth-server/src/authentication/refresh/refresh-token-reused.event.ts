export class RefreshTokenReusedEvent {
  constructor(
    public readonly userId: string,
    public readonly jti: string,
  ) {}
}
