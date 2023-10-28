import { expect } from 'chai'
import { genTsType } from 'gen-ts-type'
import {
  array,
  boolean,
  checkbox,
  color,
  date,
  email,
  float,
  id,
  inferFromSampleValue,
  int,
  literal,
  nullable,
  number,
  object,
  optional,
  Parser,
  string,
  url,
  values,
} from './core'

let mockSampleValue: any = 'mock-sample'
let mockRandomSample = function (): any {
  // mock function
}
let mockCustomSampleProps = {
  sampleValue: mockSampleValue,
  randomSample: mockRandomSample,
}

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
  it('should auto trim whitespace', () => {
    expect(string().parse(' alice ')).to.equals('alice')
    expect(string({ trim: false }).parse(' alice ')).to.equals(' alice ')
    expect(() => string({ nonEmpty: true }).parse(' ')).to.throw(
      'Invalid non-empty string, got empty string',
    )
  })
  testReflection({
    parser: string(),
    type: 'string',
    sampleValue: 'text',
    customSample: () => string(mockCustomSampleProps),
  })
})

describe('number parser', () => {
  it('should auto convert string to number', () => {
    expect(number().parse('42')).to.equals(42)
  })
  it('should pass integer', () => {
    expect(number().parse(42)).to.equals(42)
  })
  it('should pass floating point numbers', () => {
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
  testReflection({
    parser: number(),
    type: 'number',
    sampleValue: 3.14,
    customSample: () => number(mockCustomSampleProps),
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
    expect(int().parse(-42)).to.equals(-42)
  })
  testReflection({
    parser: int(),
    type: 'number',
    sampleValue: 42,
    customSample: () => int(mockCustomSampleProps),
  })
})

describe('float parser', () => {
  it('should indicate floating point number in error message', () => {
    expect(() => float().parse(null)).to.throw('Invalid float, got null')
  })
  it('should allow negative value', () => {
    expect(float().parse(-4.2)).to.equals(-4.2)
  })
  it('should trim excess digits', () => {
    expect(float({ toFixed: 2 }).parse(3.1415)).to.equals(3.14)
    expect(float({ toPrecision: 3 }).parse(3.1415)).to.equals(3.14)
  })
  testReflection({
    parser: float(),
    type: 'number',
    sampleValue: 3.14,
    customSample: () => float(mockCustomSampleProps),
  })
})

describe('boolean parser', () => {
  it('should allow truthy value', () => {
    expect(boolean().parse(true)).to.equals(true)
    expect(boolean().parse(1)).to.equals(true)
    expect(boolean().parse('non-empty string')).to.equals(true)
  })
  it('should allow falsy value', () => {
    expect(boolean().parse(false)).to.equals(false)
    expect(boolean().parse(0)).to.equals(false)
    expect(boolean().parse('')).to.equals(false)
    expect(boolean().parse(null)).to.equals(false)
    expect(boolean().parse(undefined)).to.equals(false)
  })
  it('should treat whitespace-only string as false', () => {
    expect(boolean().parse(' ')).to.equals(false)
    expect(boolean().parse('\r')).to.equals(false)
    expect(boolean().parse('\n')).to.equals(false)
    expect(boolean().parse('\t')).to.equals(false)
  })
  it('should reject if not matching specified value', () => {
    expect(() => boolean(true).parse(false)).to.throws(
      'Invalid boolean (expect: true), got boolean (false)',
    )
    expect(() => boolean(false).parse(true)).to.throws(
      'Invalid boolean (expect: false), got boolean (true)',
    )
  })
  context('semantic boolean string', () => {
    it('should parse boolean string from html form', () => {
      expect(boolean().parse('on')).to.be.true
      expect(boolean().parse('')).to.be.false
      expect(boolean().parse(undefined)).to.be.false
    })
    it('should parse literal boolean string', () => {
      expect(boolean().parse('true')).to.be.true
      expect(boolean().parse('false')).to.be.false
    })
  })
  testReflection({
    parser: boolean(),
    type: 'boolean',
    sampleValue: true,
    randomSamples: [true, false],
    customSample: false,
  })
})

describe('checkbox parser', () => {
  it('should parse "on" as true', () => {
    expect(checkbox().parse('on')).to.be.true
  })
  it('should parse undefined as true', () => {
    expect(checkbox().parse(undefined)).to.be.false
  })
  it('should reject other values', () => {
    expect(() => checkbox().parse('any string')).to.be.throws(
      'Invalid checkbox, got string',
    )
  })
  testReflection({
    parser: checkbox(),
    type: 'boolean',
    sampleValue: true,
    randomSamples: [true, false],
    customSample: () => checkbox(mockCustomSampleProps),
  })
})

describe('color parser', () => {
  it('should parse rgb hex code', () => {
    expect(color().parse('#123456')).to.be.equals('#123456')
    expect(color().parse('#ffffff')).to.be.equals('#ffffff')
    expect(color().parse('#FFFFFF')).to.be.equals('#FFFFFF')
  })
  it('should reject invalid format', () => {
    expect(() => color().parse('')).to.be.throws(
      'Invalid color, got empty string',
    )
    expect(() => color().parse('#rrggbb')).to.be.throws(
      'Invalid color, should be in "#rrggbb" hexadecimal format',
    )
  })
  testReflection({
    parser: color(),
    type: 'string',
    sampleValue: '#c0ffee',
    customSample: () => color(mockCustomSampleProps),
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
  it('should allow optional field to be null', () => {
    expect(
      object({
        username: string(),
        is_admin: optional(boolean()),
      }).parse({
        username: 'alice',
        is_admin: null,
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
  it('should parse checkbox field as boolean', () => {
    let form = object({ happy: checkbox() })
    expect(form.parse({ happy: 'on' })).to.deep.equals({ happy: true })
    expect(form.parse({})).to.deep.equals({ happy: false })
  })
  it('should indent object fields type recursively', () => {
    expect(
      object({
        friend: object({ username: string(), since: date() }),
        bookmarks: array(
          object({
            id: id(),
            remark: string(),
            tags: array(object({ id: id(), name: string() })),
          }),
        ),
      }).type,
    ).to.equals(`{
  friend: {
    username: string
    since: Date
  }
  bookmarks: Array<{
    id: number
    remark: string
    tags: Array<{
      id: number
      name: string
    }>
  }>
}`)
  })
  testReflection({
    parser: object({ username: string(), email: email() }),
    type: `{
  username: string
  email: string
}`,
    sampleValue: {
      username: string().sampleValue,
      email: email().sampleValue,
    } as any,
    customSample: () =>
      object({ username: string(), email: email() }, mockCustomSampleProps),
  })
  it('should indicate optional field in type', () => {
    let parser = object({ username: string(), email: optional(email()) })
    expect(parser.type).to.equals(`{
  username: string
  email?: string
}`)
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
  it('should reject too old date', () => {
    expect(() => date({ min: '2022-09-17' }).parse('2021-09-17')).to.throws(
      'Invalid date, min value should be "2022-09-17"',
    )
  })
  it('should reject too new date', () => {
    expect(() => date({ max: '2022-09-17' }).parse('2023-09-17')).to.throws(
      'Invalid date, max value should be "2022-09-17"',
    )
  })
  it('should accept value date within range', () => {
    expect(
      date({ min: '2022-01-01 00:00:00', max: '2022-12-31 23:59:59' }).parse(
        '2022-09-17',
      ),
    ).to.deep.equals(new Date('2022-09-17'))
  })
  testReflection({
    parser: date(),
    type: 'Date',
    sampleValue: new Date('2022-09-17'),
    customSample: () => date(mockCustomSampleProps),
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
  it('should check multiple protocols', () => {
    expect(() =>
      url({ protocols: ['https', 'http'] }).parse('ftp://example.com'),
    ).to.throws('Invalid url, protocol should be any of ["https","http"]')
    expect(
      url({ protocols: ['https', 'http'] }).parse('https://example.com'),
    ).to.equals('https://example.com')
    expect(
      url({ protocols: ['https', 'http'] }).parse('http://example.com'),
    ).to.equals('http://example.com')
  })
  testReflection({
    parser: url(),
    type: 'string',
    sampleValue: 'https://www.example.net',
    randomSamples: [
      'https://www.example.net/users/1',
      'https://www.example.net/users/2',
    ],
    customSample: () => url(mockCustomSampleProps),
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
  testReflection({
    parser: email(),
    type: 'string',
    sampleValue: 'user@example.net',
    randomSamples: ['user-1@example.net', 'user-2@example.net'],
    customSample: () => email(mockCustomSampleProps),
  })
})

describe('literal parser', () => {
  it('should reject wrong value', () => {
    expect(() => literal('guest').parse(null)).to.throws(
      'Invalid literal "guest", got null',
    )
  })
  it('should pass matched value', () => {
    expect(literal('guest').parse('guest')).to.equals('guest')
  })
  testReflection({
    parser: literal('guest'),
    type: '"guest"',
    sampleValue: 'guest',
    randomSamples: ['guest'],
    customSample: false,
    skipInfer: true,
  })
})

describe('enum values parser', () => {
  it('should reject wrong value with custom name', () => {
    expect(() =>
      values(['guest', 'customer', 'shop']).parse(null, { name: 'role' }),
    ).to.throws(
      'Invalid enum value of "role", expect ["guest","customer","shop"], got null',
    )
  })
  it('should reject wrong value without custom name', () => {
    expect(() => values(['guest', 'customer', 'shop']).parse(null)).to.throws(
      'Invalid enum value, expect ["guest","customer","shop"], got null',
    )
  })
  it('should show expected values even when nested in object', () => {
    expect(() =>
      object({ query: object({ type: values(['admin', 'user']) }) }).parse({
        query: { type: 'guest' },
      }),
    ).to.throws(
      'Invalid enum value of "query.type", expect ["admin","user"], got "guest"',
    )
  })
  it('should pass matched value', () => {
    expect(values(['guest', 'customer', 'shop']).parse('guest')).to.equals(
      'guest',
    )
  })
  testReflection({
    parser: values(['user', 'admin']),
    type: '"user" | "admin"',
    sampleValue: 'user',
    customSample: () => values(['user', 'admin'], mockCustomSampleProps),
    skipInfer: true,
  })
})

describe('nullable parser', () => {
  it('should pass null value', () => {
    expect(nullable(string()).parse(null)).to.be.null
  })
  it('should pass non-null value', () => {
    expect(nullable(string()).parse('guest')).to.equals('guest')
  })
  it('should reject not matched value', () => {
    expect(() => nullable(string()).parse(undefined)).to.throws(
      'Invalid nullable string, got undefined',
    )
  })
  testReflection({
    parser: nullable(string()),
    type: 'null | (string)',
    sampleValue: null,
    customSample: () => nullable(string(), mockCustomSampleProps),
    skipInfer: true,
  })
})

describe('array parser', () => {
  it('should reject null', () =>
    expect(() => array(string()).parse(null)).to.throws(
      'Invalid array, got null',
    ))
  it('should reject undefined', () =>
    expect(() => array(string()).parse(undefined)).to.throws(
      'Invalid array, got undefined',
    ))
  it('should reject string', () => {
    expect(() => array(string()).parse('')).to.throws(
      'Invalid array, got empty string',
    )
  })
  it('should auto wrap simple value into array', () => {
    expect(array(string(), { maybeSingle: true }).parse('food')).to.deep.equals(
      ['food'],
    )
    expect(
      array(string(), { maybeSingle: true }).parse(['food']),
    ).to.deep.equals(['food'])
  })
  it('should convert string array to int array', () => {
    expect(array(id(), { maybeSingle: true }).parse(['1', '2'])).to.deep.equals(
      [1, 2],
    )
  })
  it('should pass empty array', () => {
    expect(array(string()).parse([])).to.deep.equals([])
  })
  it('should pass non-empty array', () => {
    expect(array(string()).parse(['alice', 'bob'])).to.deep.equals([
      'alice',
      'bob',
    ])
  })
  it('should reject wrong-typed array', () => {
    expect(() => array(number()).parse(['alice', 'bob'])).to.throws(
      'Invalid array of number, got string in array',
    )
  })
  it('should reject too-short array', () => {
    expect(() => array(string(), { minLength: 3 }).parse([])).to.throws(
      'Invalid array, minLength should be 3',
    )
  })
  it('should reject too-long array', () => {
    expect(() =>
      array(string(), { maxLength: 2 }).parse(['alice', 'bob', 'charlie']),
    ).to.throws('Invalid array, maxLength should be 2')
  })
  testReflection({
    parser: array(float()),
    type: 'Array<number>',
    sampleValue: [float().sampleValue],
    customSample: () => array(float(), mockCustomSampleProps),
  })
})

describe('id parser', () => {
  it('should reject number smaller than 1', () => {
    expect(() => id().parse(0)).to.throws('Invalid id, min value should be 1')
  })
  it('should reject floating point number', () => {
    expect(() => id().parse(1.5)).to.throws(
      'Invalid id, got floating point number',
    )
  })
  it('should reject null by default', () => {
    expect(() => id().parse(null)).to.throws('Invalid id, got null')
  })
  it('should pass null value if wrapped', () => {
    expect(nullable(id()).parse(null)).to.equals(null)
  })
  testReflection({
    parser: id(),
    type: 'number',
    customSample: () => id(mockCustomSampleProps),
  })
})

function testReflection<T>(options: {
  parser: Parser<T>
  type: string
  sampleValue?: T
  randomSamples?: T[]
  customSample: (() => Parser<T>) | false
  skipInfer?: boolean
}) {
  const { parser, type } = options
  it('should have type', () => {
    expect(parser.type).to.equals(type)
  })
  it('should have sampleValue', () => {
    expect(parser).to.haveOwnProperty('sampleValue')
    if ('sampleValue' in options) {
      expect(parser.sampleValue).to.deep.equals(options.sampleValue)
    } else {
      expect(typeof parser.sampleValue).to.equals(type)
    }
  })
  it('should have randomSamples', () => {
    expect(parser).to.haveOwnProperty('randomSample')
    if (!options.randomSamples) {
      // should not throw error
      for (let sampleRemains = 100; sampleRemains > 0; sampleRemains--) {
        let sample = parser.randomSample!()
        expect(sample).not.to.be.undefined
      }
      return
    }
    for (let sample of options.randomSamples) {
      let trialRemains = 10
      for (; ; trialRemains--) {
        try {
          let value = parser.randomSample!()
          if (genTsType(value) === genTsType(sample)) {
            break
          }
          expect(value).to.deep.equals(sample)
          break
        } catch (error) {
          if (trialRemains < 0) {
            throw error
          }
        }
      }
    }
  })
  const { customSample } = options
  if (customSample) {
    it('should be able to customize sample', () => {
      let parser = customSample()
      expect(parser.sampleValue).to.equals(mockSampleValue)
      expect(parser.randomSample).to.equals(mockRandomSample)
    })
  }
  if (options.skipInfer !== true) {
    const sampleValue =
      'sampleValue' in options ? options.sampleValue : parser.sampleValue
    it('should infer from sampleValue', () => {
      let inferredParser = inferFromSampleValue(sampleValue)
      expect(inferredParser.type).equals(parser.type)
    })
  }
}
