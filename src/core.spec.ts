import { expect } from 'chai'
import { genTsType } from 'gen-ts-type'
import {
  array,
  boolean,
  checkbox,
  color,
  d2,
  d3,
  date,
  dateString,
  dict,
  email,
  enums,
  float,
  id,
  inferFromSampleValue,
  int,
  literal,
  nullable,
  number,
  object,
  optional,
  or,
  Parser,
  ParseResult,
  record,
  singletonArray,
  string,
  timestamp,
  timeString,
  toTimestampString,
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
  it('should reject empty string', () => {
    expect(() => number().parse('')).to.throw(
      'Invalid number, got empty string',
    )
  })
  it('should allow negative numbers', () => {
    expect(number().parse(-42)).to.equals(-42)
  })
  it('should round to nearest value', () => {
    expect(number().parse(0.1 + 0.2)).to.equals(0.3)
  })
  describe('human readable format', () => {
    let parser = number({ readable: true })
    it('should parse k/m/b/t units', () => {
      expect(parser.parse('3.5k')).to.equals(3.5e3)
      expect(parser.parse('3.5m')).to.equals(3.5e6)
      expect(parser.parse('3.5b')).to.equals(3.5e9)
      expect(parser.parse('3.5t')).to.equals(3.5e12)

      expect(parser.parse('3.5K')).to.equals(3.5e3)
      expect(parser.parse('3.5M')).to.equals(3.5e6)
      expect(parser.parse('3.5B')).to.equals(3.5e9)
      expect(parser.parse('3.5T')).to.equals(3.5e12)
    })
    it('should round to nearest integer', () => {
      // instead of `64900.00000000001`
      expect(parser.parse('64.9k')).to.equals(64900)
    })
    it('should skip spaces', () => {
      expect(parser.parse('12 4')).to.equals(124)
    })
    it('should skip hyphen', () => {
      expect(parser.parse('12-4')).to.equals(124)
    })
    it('should remove comma', () => {
      expect(parser.parse('123,456,789')).to.equals(123456789)
      expect(parser.parse('123,456.00')).to.equals(123456)
    })
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
    expect(int().parse('42')).to.equals(42)
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
  it('should allow skipping optional field (value)', () => {
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
  it('should allow skipping optional field (type)', () => {
    let userParser = object({
      username: string(),
      is_admin: optional(boolean()),
    })
    type User = ParseResult<typeof userParser>
    let user1: User = {
      username: 'alice',
      is_admin: true,
    }
    let user2: User = {
      username: 'alice',
      is_admin: undefined,
    }
    let user3: User = {
      username: 'alice',
    }
    // @ts-expect-error
    let user4: User = {
      is_admin: true,
    }
    // @ts-expect-error
    let user5: User = {}
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
    let parser = object({
      username: string(),
      email: optional(email()),
    })
    expect(parser.type).to.equals(`{
  username: string
  email?: string
}`)
  })
  describe('quote field name', () => {
    it('should not quote field name when the field name only contains alphabets', () => {
      let type = object({
        id: id(),
        name: string(),
      }).type
      expect(type).includes(' id: number')
      expect(type).includes(' name: string')
    })
    it('should quote field name when the field name contains symbols like hyphen', () => {
      let type = object({
        'id': id(),
        'name': string(),
        'max-char': int(),
      }).type
      expect(type).includes("'id': number")
      expect(type).includes("'name': string")
      expect(type).includes("'max-char': number")
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
  it('should reject too old date', () => {
    expect(() =>
      date({ min: '2022-09-17 13:45' }).parse('2022-09-17 13:00'),
    ).to.throws('Invalid date, min value should be "2022-09-17 13:45"')
  })
  it('should reject too new date', () => {
    expect(() =>
      date({ max: '2022-09-17 13:45' }).parse('2022-09-17 14:00'),
    ).to.throws('Invalid date, max value should be "2022-09-17 13:45"')
  })
  it('should accept value date within range', () => {
    expect(
      date({ min: '2022-01-01 13:00:00', max: '2022-12-31 13:59:59' }).parse(
        '2022-09-17 13:45',
      ),
    ).to.deep.equals(new Date('2022-09-17 13:45'))
  })
  it('should accept date in complete string', () => {
    let variants = [
      '2022-09-17T13:45:59.123Z',
      '2022-09-17T13:45:59.123',
      '2022-09-17T13:45:59',
      '2022-09-17T13:45',
      '2022-09-17 13:45:59',
      '2022-09-17 13:45',
      '2022-09-17',
    ]
    for (let variant of variants) {
      expect(date().parse(variant)).to.deep.equals(new Date(variant))
    }
  })
  it('should reject date in incomplete string', () => {
    let variants = ['2022-09-17T13', '2022-09-17 13', '2022-09', '2022']
    for (let variant of variants) {
      expect(() => date().parse(variant)).to.throw(
        `Invalid date, got string (${JSON.stringify(variant)})`,
      )
    }
  })
  testReflection({
    parser: date(),
    type: 'Date',
    sampleValue: new Date('2022-09-17'),
    customSample: () => date(mockCustomSampleProps),
  })
})

describe('dateString parser', () => {
  it('should reject null', () => {
    expect(() => dateString().parse(null)).to.throw(
      'Invalid dateString, got null',
    )
  })
  it('should reject undefined', () => {
    expect(() => dateString().parse(undefined)).to.throw(
      'Invalid dateString, got undefined',
    )
  })
  it('should reject empty string', () => {
    expect(() => dateString({ nonEmpty: true }).parse('')).to.throw(
      'Invalid non-empty dateString, got empty string',
    )
  })
  it('should allow empty string', () => {
    expect(dateString({ nonEmpty: false }).parse('')).to.equals('')
  })
  it('should accept int timestamp', () => {
    let string = '2023-09-17'
    let time = new Date(string).getTime()
    expect(dateString().parse(time)).to.equals(string)
  })
  it('should accept date instance', () => {
    let string = '2023-09-17'
    let date = new Date(string)
    expect(dateString().parse(date)).to.equals(string)
  })
  it('should accept string timestamp', () => {
    let string = '2023-09-17 00:00'
    expect(dateString().parse(string)).to.equals('2023-09-17')
  })
  it('should accept iso string timestamp', () => {
    let string = '2023-09-07'
    let date = new Date(string)
    let isoString = date.toISOString()
    expect(dateString().parse(isoString)).to.equals(string)
  })
  it('should accept dateString', () => {
    let string = '2023-09-17'
    expect(dateString().parse(string)).to.equals(string)
  })
  it('should reject too old dateString', () => {
    expect(() =>
      dateString({ min: '2022-09-17' }).parse('2021-09-17'),
    ).to.throws('Invalid dateString, min value should be "2022-09-17"')
  })
  it('should reject too new dateString', () => {
    expect(() =>
      dateString({ max: '2022-09-17' }).parse('2023-09-17'),
    ).to.throws('Invalid dateString, max value should be "2022-09-17"')
  })
  it('should accept value dateString within range', () => {
    expect(
      dateString({
        min: '2022-01-01',
        max: '2022-12-31',
      }).parse('2022-09-17'),
    ).to.deep.equals('2022-09-17')
  })
  testReflection({
    parser: dateString(),
    type: 'string',
    sampleValue: '2022-09-17',
    customSample: () => dateString(mockCustomSampleProps),
  })
})

describe('timeString parser', () => {
  it('should reject null', () => {
    expect(() => timeString().parse(null)).to.throw(
      'Invalid timeString, got null',
    )
  })
  it('should reject undefined', () => {
    expect(() => timeString().parse(undefined)).to.throw(
      'Invalid timeString, got undefined',
    )
  })
  it('should reject empty string', () => {
    expect(() => timeString({ nonEmpty: true }).parse('')).to.throw(
      'Invalid non-empty timeString, got empty string',
    )
  })
  it('should allow empty string', () => {
    expect(timeString({ nonEmpty: false }).parse('')).to.equals('')
  })
  it('should accept int timestamp', () => {
    let string = '2023-09-17 13:45'
    let time = new Date(string).getTime()
    expect(timeString().parse(time)).to.equals('13:45')
  })
  it('should accept date instance', () => {
    let string = '2023-09-17 13:45'
    let date = new Date(string)
    expect(timeString().parse(date)).to.equals('13:45')
  })
  it('should accept string timestamp', () => {
    let string = '2023-09-17 13:45'
    expect(timeString().parse(string)).to.equals('13:45')
  })
  it('should accept iso string timestamp', () => {
    let string = '2023-09-07T13:45:00.000Z'
    expect(timeString().parse(string)).to.equals('13:45')
  })
  it('should accept variant of string', () => {
    let variants = [
      '2023-09-07T09:45:00.000Z',
      '2023-09-07 09:45:00',
      '2023-09-07 09:45',
      '2023-09-07 9:45',
      '09:45:00',
      '09:45',
      '9:45',
    ]
    for (let variant of variants) {
      expect(timeString().parse(variant)).to.equals('09:45')
    }
  })
  it('should accept timeString', () => {
    let string = '13:45'
    expect(timeString().parse(string)).to.equals(string)
  })
  it('should remove seconds from timeString', () => {
    let string = '13:45:59'
    expect(timeString().parse(string)).to.equals('13:45')
  })
  it('should remove milliseconds from timeString', () => {
    let string = '13:45:59.123'
    expect(timeString().parse(string)).to.equals('13:45')
  })
  it('should reject too old timeString', () => {
    expect(() => timeString({ min: '14:00' }).parse('13:45')).to.throws(
      'Invalid timeString, min value should be "14:00"',
    )
  })
  it('should reject too new timeString', () => {
    expect(() => timeString({ max: '13:45' }).parse('14:00')).to.throws(
      'Invalid timeString, max value should be "13:45"',
    )
  })
  it('should accept value timeString within range', () => {
    expect(
      timeString({
        min: '13:00',
        max: '14:00',
      }).parse('13:45'),
    ).to.deep.equals('13:45')
  })
  it('should allow using Date and number as min/max range', () => {
    expect(
      timeString({
        min: new Date('2023-09-17 13:00'),
        max: new Date('2023-09-17 14:00').getTime(),
      }).parse('13:45'),
    ).to.deep.equals('13:45')
  })
  describe('precision', () => {
    it('should default to minute precision', () => {
      expect(timeString().parse('13:45:59.123')).to.equals('13:45')
    })
    it('should support millisecond precision', () => {
      expect(
        timeString({ precision: 'millisecond' }).parse('13:45:59.123'),
      ).to.equals('13:45:59.123')
    })
    it('should support second precision', () => {
      expect(
        timeString({ precision: 'second' }).parse('13:45:59.123'),
      ).to.equals('13:45:59')
    })
    it('should support minute precision', () => {
      expect(
        timeString({ precision: 'minute' }).parse('13:45:59.123'),
      ).to.equals('13:45')
    })
  })
  testReflection({
    parser: timeString(),
    type: 'string',
    sampleValue: '13:45',
    customSample: () => timeString(mockCustomSampleProps),
  })
})

describe('timestamp parser', () => {
  it('should reject null', () => {
    expect(() => timestamp().parse(null)).to.throw(
      'Invalid timestamp, got null',
    )
  })
  it('should reject undefined', () => {
    expect(() => timestamp().parse(undefined)).to.throw(
      'Invalid timestamp, got undefined',
    )
  })
  it('should reject empty string', () => {
    expect(() => timestamp({ nonEmpty: true }).parse('')).to.throw(
      'Invalid non-empty timestamp, got empty string',
    )
  })
  it('should allow empty string', () => {
    expect(timestamp({ nonEmpty: false }).parse('')).to.equals('')
  })
  it('should accept int timestamp', () => {
    let string = '2023-09-17 13:45:00'
    let time = new Date(string).getTime()
    expect(timestamp().parse(time)).to.equals(string)
  })
  it('should accept date instance', () => {
    let string = '2023-09-17 13:45:00'
    let date = new Date(string)
    expect(timestamp().parse(date)).to.equals(string)
  })
  it('should accept string timestamp', () => {
    let string = '2023-09-17 13:45'
    expect(timestamp().parse(string)).to.equals('2023-09-17 13:45:00')
  })
  it('should accept iso string timestamp', () => {
    let isoString = '2023-09-07T13:45:00'
    let string = '2023-09-07 13:45:00'
    expect(timestamp().parse(isoString)).to.equals(string)
  })
  it('should accept timestamp', () => {
    let string = '2023-09-17 13:45:00'
    expect(timestamp().parse(string)).to.equals(string)
  })
  it('should reject too old timestamp', () => {
    expect(() =>
      timestamp({ min: '2022-09-17 14:00:00' }).parse('2021-09-17 13:45:00'),
    ).to.throws('Invalid timestamp, min value should be "2022-09-17 14:00:00"')
  })
  it('should reject too new timestamp', () => {
    expect(() =>
      timestamp({ max: '2022-09-17 13:00:00' }).parse('2023-09-17 13:45:00'),
    ).to.throws('Invalid timestamp, max value should be "2022-09-17 13:00:00"')
  })
  it('should accept value timestamp within range', () => {
    expect(
      timestamp({
        min: '2022-09-17 13:00:00',
        max: '2022-09-17 14:00:00',
      }).parse('2022-09-17 13:45:00'),
    ).to.deep.equals('2022-09-17 13:45:00')
  })
  describe('precision', () => {
    it('should default to second precision', () => {
      expect(timestamp().parse('2022-09-17 13:45:59.123')).to.equals(
        '2022-09-17 13:45:59',
      )
    })
    it('should support millisecond precision', () => {
      expect(
        timestamp({ precision: 'millisecond' }).parse(
          '2022-09-17 13:45:59.123',
        ),
      ).to.equals('2022-09-17 13:45:59.123')
    })
    it('should support second precision', () => {
      expect(
        timestamp({ precision: 'second' }).parse('2022-09-17 13:45:59.123'),
      ).to.equals('2022-09-17 13:45:59')
    })
    it('should support minute precision', () => {
      expect(
        timestamp({ precision: 'minute' }).parse('2022-09-17 13:45:59.123'),
      ).to.equals('2022-09-17 13:45')
    })
  })
  testReflection({
    parser: timestamp(),
    type: 'string',
    sampleValue: '2022-09-17 13:45:00',
    customSample: () => timestamp(mockCustomSampleProps),
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

describe('enums values parser', () => {
  it('should reject wrong value with custom name', () => {
    expect(() =>
      values(['guest', 'customer', 'shop']).parse(null, { name: 'role' }),
    ).to.throws(
      'Invalid enums value of "role", expect ["guest","customer","shop"], got null',
    )
  })
  it('should infer to literal type without explicit "as const"', () => {
    let roleParser = values(['guest', 'customer', 'shop'])
    type Role = ParseResult<typeof roleParser>
    let role_correct: Role = 'guest'
    // @ts-expect-error
    let role_wrong: Role = 'admin'
  })
  it('should reject wrong value without custom name', () => {
    expect(() => values(['guest', 'customer', 'shop']).parse(null)).to.throws(
      'Invalid enums value, expect ["guest","customer","shop"], got null',
    )
  })
  it('should show expected values even when nested in object', () => {
    expect(() =>
      object({ query: object({ type: values(['admin', 'user']) }) }).parse({
        query: { type: 'guest' },
      }),
    ).to.throws(
      'Invalid enums value of "query.type", expect ["admin","user"], got "guest"',
    )
  })
  it('should pass matched value', () => {
    expect(values(['guest', 'customer', 'shop']).parse('guest')).to.equals(
      'guest',
    )
  })
  it('should alias to enums', () => {
    expect(values).to.equals(enums)
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
  it('should use bracket for complex type', () => {
    expect(nullable(values(['active', 'hidden'])).type).to.equals(
      'null | ("active" | "hidden")',
    )
  })
  it('should not use bracket for simple types', () => {
    expect(nullable(string()).type).to.equals('null | string')
    expect(nullable(number()).type).to.equals('null | number')
  })
  testReflection({
    parser: nullable(string()),
    type: 'null | string',
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

describe('singletonArray parser', () => {
  it('should unwrap first element from array', () => {
    expect(singletonArray(string()).parse(['alice'])).to.equals('alice')
  })
  it('should reject empty array', () => {
    expect(() => singletonArray(string()).parse([])).to.throws(
      'Invalid singletonArray, minLength should be 1',
    )
  })
  it('should reject array with more than one element', () => {
    expect(() => singletonArray(string()).parse(['alice', 'bob'])).to.throws(
      'Invalid singletonArray, maxLength should be 1',
    )
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

describe('or parser', () => {
  it('should reject null', () => {
    expect(() => or([string(), number()]).parse(null)).to.throws(
      'Invalid union type of (string | number), got null',
    )
  })
  it('should reject undefined', () => {
    expect(() => or([string(), number()]).parse(undefined)).to.throws(
      'Invalid union type of (string | number), got undefined',
    )
  })
  it('should reject array', () => {
    expect(() => or([string(), number()]).parse([])).to.throws(
      'Invalid union type of (string | number), got array',
    )
  })
  it('should reject object', () => {
    expect(() => or([string(), number()]).parse({})).to.throws(
      'Invalid union type of (string | number), got object',
    )
  })
  it('should pass first parser', () => {
    expect(or([literal('a'), literal('b')]).parse('a')).to.equals('a')
  })
  it('should pass second parser', () => {
    expect(or([literal('a'), literal('b')]).parse('b')).to.equals('b')
  })
  it('should reject when both parsers reject', () => {
    expect(() => or([literal('a'), literal('b')]).parse('c')).to.throws(
      'Invalid union type of ("a" | "b"), got string',
    )
  })
  it('should include error message from all parsers', () => {
    // simplified from res-index npm package detail parser
    let unpublished_parser = object({
      name: string(),
      time: object({
        created: date(),
        modified: optional(date()),
        unpublished: object({
          time: date(),
          versions: array(string()),
        }),
      }),
    })
    let published_parser = object({
      name: string(),
      versions: dict({
        key: string(),
        value: object({
          homepage: optional(string()),
          dist: object({
            fileCount: optional(int({ min: 1 })),
            unpackedSize: optional(int({ min: 1 })),
          }),
        }),
      }),
    })
    let not_found_parser = object({
      error: literal('Not found'),
    })
    let parser = or([unpublished_parser, published_parser, not_found_parser])
    let data = {
      name: 'svelte-icons',
      versions: {
        '0.0.0': {
          name: 'svelte-icons',
          dist: {
            fileCount: 0,
            unpackedSize: 0,
            signatures: [
              {
                keyid: 'SHA256:jl3bw',
                sig: 'MEQCIBy',
              },
            ],
          },
        },
      },
    }
    let error
    try {
      parser.parse(data)
    } catch (e) {
      error = e
    }
    expect(error).not.to.be.undefined
    expect(error.errors).to.have.lengthOf(3)
    expect(error.message).to.equals(
      `Invalid union type of ({
  name: string
  time: {
    created: Date
    modified?: Date
    unpublished: {
      time: Date
      versions: Array<string>
    }
  }
} | {
  name: string
  versions: Record<string,{
    homepage?: string
    dist: {
      fileCount?: number
      unpackedSize?: number
    }
  }>
} | {
  error: "Not found"
}), (Invalid object, missing "time") and (Invalid int "versions.dist.fileCount", min value should be 1) and (Invalid object, missing "error")`,
    )
  })
  it('should pass second parser', () => {
    expect(or([literal('a'), literal('b')]).parse('b')).to.equals('b')
  })
  it('should prioritize first parser', () => {
    expect(or([string(), number()]).parse(42)).to.equals('42')
    expect(or([number(), string()]).parse('42')).to.equals(42)
  })
})

describe('dict parser', () => {
  it('should reject null', () => {
    expect(() =>
      dict({ key: string(), value: string() }).parse(null),
    ).to.throws('Invalid dict/record, got null')
  })
  it('should reject number', () => {
    expect(() => dict({ key: string(), value: string() }).parse(42)).to.throws(
      'Invalid dict/record, got number',
    )
  })
  it('should reject string', () => {
    expect(() => dict({ key: string(), value: string() }).parse('')).to.throws(
      'Invalid dict/record, got empty string',
    )
  })
  it('should pass empty object', () => {
    expect(dict({ key: string(), value: string() }).parse({})).to.deep.equals(
      {},
    )
  })
  const fieldNameParser = values(['create_time', 'update_time'])
  const sortTypeParser = values(['asc', 'desc'])
  const sortParser = dict({ key: fieldNameParser, value: sortTypeParser })
  it('should pass dict with matched key type and value type', () => {
    const input = { create_time: 'asc' }
    const actual = sortParser.parse(input)
    expect(actual).to.deep.equals(input)
  })
  it('should reject dict with mismatched value type', () => {
    expect(() =>
      sortParser.parse({
        create_time: 'random',
      }),
    ).to.throws('Invalid dict/record, got "random" in value')
  })
  it('should reject dict with mismatched key type', () => {
    expect(() =>
      sortParser.parse({
        cancel_time: 'asc',
      }),
    ).to.throws('Invalid dict/record, got "cancel_time" in key')
  })
  it('should alias to record', () => {
    expect(dict).to.equals(record)
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

describe('inferFromSampleValue', () => {
  it('should infer enums field', () => {
    let sampleValue = {
      username: 'alice',
      role_1$enums: ['admin', 'staff', 'customer'],
      role_2$enum: ['admin', 'staff', 'customer'],
    }
    let parser = inferFromSampleValue(sampleValue)
    expect(parser.type).to.equals(`{
  username: string
  role_1: "admin" | "staff" | "customer"
  role_2: "admin" | "staff" | "customer"
}`)
  })
  it('should infer nullable field', () => {
    let sampleValue = {
      id: 1,
      cancel_time_1$nullable: new Date(),
      cancel_time_2$null: new Date(),
    }
    let parser = inferFromSampleValue(sampleValue)
    expect(parser.type).to.equals(`{
  id: number
  cancel_time_1: null | Date
  cancel_time_2: null | Date
}`)
  })
  it('should infer optional field', () => {
    let sampleValue = {
      'id': 1,
      'cancel_time_1$optional': new Date(),
      'cancel_time_2?': new Date(),
    }
    let parser = inferFromSampleValue(sampleValue)
    expect(parser.type).to.equals(`{
  id: number
  cancel_time_1?: Date
  cancel_time_2?: Date
}`)
    parser.parse({ id: 1 })
  })
  it('should infer optional, nullable and enums field in any order', () => {
    let variants = [
      '$optional$nullable$enums',
      '$null$optional$enum',
      '$enum$optional$null',
      '$enum$null?',
    ]
    for (let variant of variants) {
      let sampleValue = {
        id: 1,
        ['status' + variant]: ['active', 'inactive'],
      }
      let parser = inferFromSampleValue(sampleValue)
      expect(parser.type).to.equals(`{
  id: number
  status?: null | ("active" | "inactive")
}`)
    }
  })
  it('should infer result type without enums/nullable/optional flags', () => {
    let parser = inferFromSampleValue({
      'status_1$enums': ['a' as const, 'b' as const],
      'status_2$enum': ['a' as const, 'b' as const],
      'status_3$nullable': 's',
      'status_4$null': 's',
      'status_5$optional': 's',
      'status_6?': 's',
      'status_7$optional$nullable': 's',
      'status_8$nullable$optional': 's',
      'status_9$enum$nullable$optional': ['a' as const, 'b' as const],
      'status_10$nullable$enums?': ['a' as const, 'b' as const],
      'status_11$nullable$optional$enum': ['a' as const, 'b' as const],
    })
    type Result = ParseResult<typeof parser>
    type Key = keyof Result
    let result = parser.parse({
      status_1: 'a',
      status_2: 'a',
      status_3: null,
      status_4: null,
    })
    function checkType<T>(t: T) {
      /* noop */
    }
    checkType<{
      status_1: 'a' | 'b'
      status_2: 'a' | 'b'
      status_3: null | string
      status_4: null | string
      status_5?: undefined | string
      status_6?: undefined | string
      status_7?: undefined | null | string
      status_8?: undefined | null | string
      status_9?: undefined | null | 'a' | 'b'
      status_10?: undefined | null | 'a' | 'b'
      status_11?: undefined | null | 'a' | 'b'
    }>(result)
  })
  it('should recursively infer result type', () => {
    let parser = inferFromSampleValue({
      a$nullable: {
        b$optional: {
          c$enums: ['a' as const, 'b' as const],
        },
      },
    })
    let result = parser.parse({ a: { b: { c: 'a' } } })
    expect(result.a?.b?.c).to.equals('a')
  })
})

describe('d2', () => {
  it('should add leading 0 when number is single digit', () => {
    expect(d2(0)).to.equals('00')
    expect(d2(1)).to.equals('01')
    expect(d2(9)).to.equals('09')
  })
  it('should not add leading 0 when number is double digit', () => {
    expect(d2(10)).to.equals(10)
    expect(d2(99)).to.equals(99)
  })
})

describe('d3', () => {
  it('should add leading 0 when number is single digit', () => {
    expect(d3(0)).to.equals('000')
    expect(d3(1)).to.equals('001')
    expect(d3(9)).to.equals('009')
  })
  it('should add leading 0 when number is double digit', () => {
    expect(d3(10)).to.equals('010')
    expect(d3(99)).to.equals('099')
  })
  it('should not add leading 0 when number is triple digit', () => {
    expect(d3(100)).to.equals(100)
    expect(d3(999)).to.equals(999)
  })
})
