export type Parser<T> = {
  parse(input: unknown, context: ParserContext): T
}

export type ParserContext = {
  overrideType?: string
  name?: string
}

export type InvalidInputErrorOptions = {
  name: string | undefined
  expectedType: string
  reason: string
}
export class InvalidInputError extends Error {
  constructor(options: InvalidInputErrorOptions) {
    let message = `Invalid ${options.expectedType}`
    if (options.name) {
      message += ' ' + JSON.stringify(options.name)
    }
    message += ', ' + options.reason
    super(message)
  }
}

function toType(input: unknown): string {
  if (input === null) {
    return 'null'
  }
  if (input === '') {
    return 'empty string'
  }
  if (Number.isNaN(input)) {
    return 'NaN'
  }
  return typeof input
}

export type StringOptions = {
  minLength?: number
  maxLength?: number
  match?: RegExp
}
export function string(options: StringOptions = {}) {
  function parse(input: unknown, context: ParserContext = {}): string {
    let expectedType = context.overrideType || 'string'
    if (typeof input === 'number') {
      if (Number.isNaN(input)) {
        throw new InvalidInputError({
          name: context.name,
          expectedType,
          reason: 'got NaN',
        })
      }
      input = String(input)
    }
    if (typeof input !== 'string') {
      throw new InvalidInputError({
        name: context.name,
        expectedType,
        reason: 'got ' + toType(input),
      })
    }
    if (typeof options.minLength === 'number') {
      if (input.length < options.minLength) {
        throw new InvalidInputError({
          name: context.name,
          expectedType,
          reason: 'minLength should be ' + options.minLength,
        })
      }
    }
    if (typeof options.maxLength === 'number') {
      if (input.length > options.maxLength) {
        throw new InvalidInputError({
          name: context.name,
          expectedType,
          reason: 'maxLength should be ' + options.maxLength,
        })
      }
    }
    if (options.match) {
      if (!options.match.test(input)) {
        throw new InvalidInputError({
          name: context.name,
          expectedType,
          reason: 'should match ' + options.match,
        })
      }
    }
    return input
  }
  return { parse, options }
}

let urlRegex = /^(.+?):\/\/(.+?)(\/|$)/
export type UrlOptions = StringOptions & {
  domain?: string
  protocol?: string
}
export function url(options: UrlOptions = {}) {
  let parser = string(options)
  function parse(input: unknown, context: ParserContext = {}): string {
    let url = parser.parse(input, {
      ...context,
      overrideType: context.overrideType || 'url',
    })
    if (!url) {
      throw new InvalidInputError({
        name: context.name,
        expectedType: 'url',
        reason: 'got empty string',
      })
    }
    let match = url.match(urlRegex)
    if (!match) {
      throw new InvalidInputError({
        name: context.name,
        expectedType: 'url',
        reason: 'should contains protocol and domain/host',
      })
    }
    let protocol = match[1]
    let domain = match[2]
    if (typeof options.protocol === 'string' && protocol !== options.protocol) {
      throw new InvalidInputError({
        name: context.name,
        expectedType: 'url',
        reason: 'protocol should be ' + JSON.stringify(options.protocol),
      })
    }
    if (typeof options.domain === 'string' && domain !== options.domain) {
      throw new InvalidInputError({
        name: context.name,
        expectedType: 'url',
        reason: 'domain should be ' + JSON.stringify(options.domain),
      })
    }
    return url
  }
  return { parse }
}

export type NumberOptions = {
  min?: number
  max?: number
}
export function number(options: NumberOptions = {}) {
  function parse(input: unknown, context: ParserContext = {}): number {
    let expectedType = context.overrideType || 'number'
    if (typeof input === 'string') {
      input = +input
    }
    if (typeof input !== 'number') {
      throw new InvalidInputError({
        name: context.name,
        expectedType,
        reason: 'got ' + toType(input),
      })
    }
    if (Number.isNaN(input)) {
      throw new InvalidInputError({
        name: context.name,
        expectedType,
        reason: 'got NaN',
      })
    }
    if (typeof options.min === 'number') {
      if (input < options.min) {
        throw new InvalidInputError({
          name: context.name,
          expectedType,
          reason: 'min value should be ' + options.min,
        })
      }
    }
    if (typeof options.max === 'number') {
      if (input > options.max) {
        throw new InvalidInputError({
          name: context.name,
          expectedType,
          reason: 'max value should be ' + options.max,
        })
      }
    }
    return input
  }
  return { parse, options }
}

export function float(options: NumberOptions = {}) {
  let parser = number(options)
  function parse(input: unknown, context: ParserContext = {}): number {
    return parser.parse(input, {
      ...context,
      overrideType: context.overrideType || 'float',
    })
  }
  return { parse, options }
}

export function int(options: NumberOptions = {}) {
  let parseNumber = number(options).parse
  function parse(input: unknown, context: ParserContext = {}): number {
    let value = parseNumber(input, {
      ...context,
      overrideType: context.overrideType || 'int',
    })
    if (Number.isInteger(value)) {
      return value
    }
    throw new InvalidInputError({
      name: context.name,
      expectedType: 'int',
      reason: 'got floating point number',
    })
  }
  return { parse, options }
}

export type ObjectOptions<T extends object> = {
  [P in keyof T]: Parser<T[P]>
}

export function object<T extends object>(
  options: ObjectOptions<T> = {} as any,
) {
  function parse(input: unknown, context: ParserContext = {}): T {
    let name = context.name
    if (input === null) {
      throw new InvalidInputError({
        name,
        expectedType: 'object',
        reason: 'got null',
      })
    }
    if (typeof input !== 'object') {
      throw new InvalidInputError({
        name,
        expectedType: 'object',
        reason: 'got ' + toType(input),
      })
    }
    let object: T = {} as any
    for (let key in options) {
      let valueParser = options[key]
      if (!(key in input)) {
        if (isOptional(valueParser)) {
          continue
        }
        throw new InvalidInputError({
          name,
          expectedType: 'object',
          reason: 'missing ' + JSON.stringify(key),
        })
      }
      let valueInput = input[key as keyof typeof input]
      let value = valueParser.parse(valueInput, { name: concatName(name, key) })
      object[key] = value
    }
    return object
  }
  return { parse, options }
}

export function optional<T>(parser: Parser<T>) {
  return Object.assign(parser, { optional: true })
}

function isOptional(parser: Parser<unknown>): boolean {
  return (parser as any).optional
}

export function boolean(expectedValue?: boolean) {
  if (expectedValue !== undefined) {
    expectedValue = !!expectedValue
  }
  function parse(input: unknown, context: ParserContext = {}): boolean {
    let value = !!input
    if (typeof expectedValue === 'boolean') {
      if (value !== expectedValue) {
        throw new InvalidInputError({
          name: context.name,
          expectedType: 'boolean',
          reason: 'got ' + toType(input),
        })
      }
    }
    return value
  }
  return { parse, expectedValue }
}

export function date() {
  function parse(input: unknown, context: ParserContext = {}): Date {
    function checkDate(date: Date): Date {
      if (Number.isNaN(date.getTime())) {
        throw new InvalidInputError({
          name: context.name,
          expectedType: 'date',
          reason: 'got ' + toType(input),
        })
      }
      return date
    }
    if (input instanceof Date) {
      return checkDate(input)
    }
    if (typeof input === 'number') {
      return checkDate(new Date(input))
    }
    if (typeof input === 'string') {
      return checkDate(new Date(input))
    }
    throw new InvalidInputError({
      name: context.name,
      expectedType: 'date',
      reason: 'got ' + toType(input),
    })
  }
  return { parse }
}

function concatName(name: string | undefined, key: string): string {
  if (name) {
    return name + '.' + key
  }
  return key
}
