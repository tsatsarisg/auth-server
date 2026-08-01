import { UserService } from './user.service.js';
import { type PasswordHasher } from './ports/password-hasher.js';
import { InMemoryUserRepository } from './adapters/in-memory/user.repository.in-memory.js';

describe('UserService', () => {
  let repo: InMemoryUserRepository;
  let hasher: { hash: jest.Mock; compare: jest.Mock };
  let service: UserService;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    hasher = {
      hash: jest.fn((plain: string) => Promise.resolve(`hashed:${plain}`)),
      compare: jest.fn((plain: string, stored: string) => Promise.resolve(stored === `hashed:${plain}`)),
    };
    service = new UserService(repo, hasher as unknown as PasswordHasher);
  });

  it('stores a normalized email and the hashed password on create', async () => {
    const user = await service.create('  Foo.Bar@Example.COM ', 'password1234');

    expect(user.email).toBe('foo.bar@example.com');
    expect(user.passwordHash).toBe('hashed:password1234');
    await expect(repo.findByEmail('foo.bar@example.com')).resolves.not.toBeNull();
  });

  it('rejects passwords below the domain minimum', async () => {
    await expect(service.create('a@b.com', 'short')).rejects.toThrow('PasswordTooShort');
  });

  it('verifies credentials case- and whitespace-insensitively on the email', async () => {
    await service.create('Foo.Bar@Example.com', 'password1234');

    const user = await service.verifyCredentials('FOO.BAR@EXAMPLE.COM', 'password1234');

    expect(user?.email).toBe('foo.bar@example.com');
  });

  it('returns null for a wrong password', async () => {
    await service.create('a@b.com', 'password1234');
    await expect(service.verifyCredentials('a@b.com', 'not-the-password')).resolves.toBeNull();
  });

  it('still performs a hash comparison for unknown emails (timing equalization)', async () => {
    const result = await service.verifyCredentials('ghost@example.com', 'whatever-password');

    expect(result).toBeNull();
    expect(hasher.compare).toHaveBeenCalledTimes(1);
  });
});
