import { Email } from './email.vo.js';

describe('Email', () => {
  it('normalizes by trimming and lowercasing', () => {
    expect(Email.normalize('  Foo.Bar@Example.COM ')).toBe('foo.bar@example.com');
  });

  it('creates a normalized value object', () => {
    expect(Email.create('  User@Domain.COM ').value).toBe('user@domain.com');
  });

  it.each(['', 'not-an-email', 'a@b', 'spaces in@mail.com'])('rejects invalid input %p', (raw) => {
    expect(() => Email.create(raw)).toThrow('InvalidEmail');
  });

  it('compares by value', () => {
    expect(Email.create('a@b.co').equals(Email.create('A@B.CO'))).toBe(true);
    expect(Email.create('a@b.co').equals(Email.create('x@y.co'))).toBe(false);
  });
});
