import { expect } from 'chai'
import { float, int, number, object, string } from './core'

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
})
