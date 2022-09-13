import { expect } from 'chai'
import { float, int, number, string } from './core'

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
  it('should alias to float parser', () => {
    expect(number).to.equals(float)
  })
})

describe('int parser', () => {
  it('should auto convert string to number', () => {
    expect(int().parse(42)).to.equals(42)
  })
  it('should reject floating point numbers', () => {
    expect(() => int().parse(4.2)).to.throw(
      'Invalid number, got floating point number',
    )
  })
  it('should reject NaN', () => {
    expect(() => int().parse(NaN)).to.throw('Invalid number, got NaN')
  })
  it('should reject null', () => {
    expect(() => int().parse(null)).to.throw('Invalid number, got null')
  })
})
