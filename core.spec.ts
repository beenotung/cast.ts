import { expect } from 'chai'
import {
  boolean,
  date,
  email,
  float,
  int,
  number,
  object,
  optional,
  string,
  url,
} from './core'

describe('string parser', () => {
  it('should auto convert number into string', () => {
    expect(string().parse(42)).to.equals('42')
  })
  it('should reject empty string', () => {
    expect(() => string({ minLength: 1 }).parse('')).to.throw(
      'Invalid string, minLength should be 1',
    )
  })
  it('should reject long string', () => {
    expect(() => string({ maxLength: 1 }).parse('42')).to.throw(
      'Invalid string, maxLength should be 1',
    )
  })
  it('should reject null', () => {
    expect(() => string().parse(null)).to.throw('Invalid string, got null')
  })
  it('should reject NaN', () => {
    expect(() => string().parse(NaN)).to.throw('Invalid string, got NaN')
  })
  it('should match with regex', () => {
    expect(string({ match: /2/ }).parse('42')).to.equals('42')
    expect(() => string({ match: /a-z/ }).parse('42')).to.throw(
      'Invalid string, should match /a-z/',
    )
  })
  it('should allow non-empty string', () => {
    expect(string().parse('42')).to.equals('42')
  })
})

describe('number parser', () => {
  it('should auto convert string to number', () => {
    expect(number().parse(42)).to.equals(42)
  })
  it('should not reject floating point numbers', () => {
    expect(number().parse(4.2)).to.equals(4.2)
  })
  it('should reject NaN', () => {
    expect(() => number().parse(NaN)).to.throw('Invalid number, got NaN')
  })
  it('should reject null', () => {
    expect(() => number().parse(null)).to.throw('Invalid number, got null')
  })
  it('should reject small value', () => {
    expect(() => number({ min: 50 }).parse(49)).to.throw(
      'Invalid number, min value should be 50',
    )
  })
  it('should reject big value', () => {
    expect(() => number({ max: 50 }).parse(51)).to.throw(
      'Invalid number, max value should be 50',
    )
  })
  it('should allow negative numbers', () => {
    expect(number().parse(-42)).to.equals(-42)
  })
})

describe('int parser', () => {
  it('should auto convert string to number', () => {
    expect(int().parse(42)).to.equals(42)
  })
  it('should reject floating point numbers', () => {
    expect(() => int().parse(4.2)).to.throw(
      'Invalid int, got floating point number',
    )
  })
  it('should reject NaN', () => {
    expect(() => int().parse(NaN)).to.throw('Invalid int, got NaN')
  })
  it('should reject null', () => {
    expect(() => int().parse(null)).to.throw('Invalid int, got null')
  })
  it('should allow negative integer', () => {
    expect(number().parse(-42)).to.equals(-42)
  })
})

describe('float parser', () => {
  it('should indicate floating point number in error message', () => {
    expect(() => float().parse(null)).to.throw('Invalid float, got null')
  })
  it('should allow negative integer', () => {
    expect(number().parse(-42)).to.equals(-42)
  })
})

describe('boolean parser', () => {
  it('should allow truthy value', () => {
    expect(boolean(true).parse(true)).to.equals(true)
    expect(boolean(true).parse(1)).to.equals(true)
    expect(boolean(true).parse(' ')).to.equals(true)
  })
  it('should allow falsy value', () => {
    expect(boolean(false).parse(false)).to.equals(false)
    expect(boolean(false).parse(0)).to.equals(false)
    expect(boolean(false).parse('')).to.equals(false)
    expect(boolean(false).parse(null)).to.equals(false)
    expect(boolean(false).parse(undefined)).to.equals(false)
  })
})

describe('object parser', () => {
  it('should reject null', () => {
    expect(() => object().parse(null)).to.throw('Invalid object, got null')
  })
  it('should reject undefined', () => {
    expect(() => object().parse(undefined)).to.throw(
      'Invalid object, got undefined',
    )
  })
  it('should reject missing field', () => {
    expect(() =>
      object({
        username: string(),
      }).parse({}),
    ).to.throw('Invalid object, missing "username"')
    expect(() =>
      object({
        username: string(),
        password: string(),
      }).parse({
        username: 'alice',
      }),
    ).to.throw('Invalid object, missing "password"')
  })
  describe('field name in error message', () => {
    it('should show object property key', () => {
      expect(() =>
        object({
          username: string({ minLength: 3 }),
        }).parse({
          username: 'it',
        }),
      ).to.throw('Invalid string "username", minLength should be 3')
    })
    it('should show nested field name', () => {
      expect(() =>
        object({
          body: object({
            username: string({ minLength: 3 }),
          }),
        }).parse({
          body: { username: 'it' },
        }),
      ).to.throw('Invalid string "body.username", minLength should be 3')
    })
    it('should show custom field name', () => {
      expect(() =>
        object({
          body: object({
            username: string({ minLength: 3 }),
          }),
        }).parse(
          {
            body: { username: 'it' },
          },
          { name: 'req' },
        ),
      ).to.throw('Invalid string "req.body.username", minLength should be 3')
    })
  })
  it('should allow skipping optional field', () => {
    expect(
      object({
        username: string(),
        is_admin: optional(boolean()),
      }).parse({
        username: 'alice',
      }),
    ).to.deep.equals({
      username: 'alice',
    })
  })
  it('should allow providing optional field', () => {
    expect(
      object({
        username: string(),
        is_admin: optional(boolean()),
      }).parse({
        username: 'alice',
        is_admin: true,
      }),
    ).to.deep.equals({
      username: 'alice',
      is_admin: true,
    })
  })
})

describe('date parser', () => {
  it('should reject null', () => {
    expect(() => date().parse(null)).to.throw('Invalid date, got null')
  })
  it('should reject undefined', () => {
    expect(() => date().parse(undefined)).to.throw(
      'Invalid date, got undefined',
    )
  })
  it('should reject empty string', () => {
    expect(() => date().parse('')).to.throw('Invalid date, got empty string')
  })
  it('should accept int timestamp', () => {
    let now = Date.now()
    expect(date().parse(now)).to.deep.equals(new Date(now))
  })
  it('should accept date instance', () => {
    let now = new Date()
    expect(date().parse(now)).to.deep.equals(now)
  })
  it('should not modify date timestamp', () => {
    let timestamp = Date.now()
    let dateInstance = date().parse(timestamp)
    expect(dateInstance.getTime()).to.equals(timestamp)
  })
})

describe('url parser', () => {
  it('should reject null', () => {
    expect(() => url().parse(null)).to.throws('Invalid url, got null')
  })
  it('should reject empty string', () => {
    expect(() => url({ nonEmpty: true }).parse('')).to.throws(
      'Invalid non-empty url, got empty string',
    )
  })
  it('should reject wrong protocol', () => {
    expect(() =>
      url({ protocol: 'http' }).parse('ftp://example.com'),
    ).to.throws('Invalid url, protocol should be "http"')
  })
  it('should reject wrong domain', () => {
    expect(() =>
      url({ domain: 'example.net' }).parse('ftp://example.com'),
    ).to.throws('Invalid url, domain should be "example.net"')
  })
  it('should pass valid url', () => {
    expect(
      url({ protocol: 'https', domain: 'example.net' }).parse(
        'https://example.net/home',
      ),
    ).to.equals('https://example.net/home')
  })
})

describe('email parser', () => {
  it('should reject null', () => {
    expect(() => email().parse(null)).to.throws('Invalid email, got null')
  })
  it('should reject empty string', () => {
    expect(() => email({ nonEmpty: true }).parse('')).to.throws(
      'Invalid non-empty email, got empty string',
    )
  })
  it('should reject wrong domain', () => {
    expect(() =>
      email({ domain: 'example.net' }).parse('user@example.com'),
    ).to.throws('Invalid email, domain should be "example.net"')
  })
  it('should pass matched domain', () => {
    expect(
      email({ domain: 'example.net' }).parse('user@example.net'),
    ).to.equals('user@example.net')
  })
  it('should pass valid email', () => {
    expect(email().parse('user@example.net')).to.equals('user@example.net')
  })
})
