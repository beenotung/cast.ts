export type Parser<T> = {
  parse(input: unknown, context: ParserContext): T
}

export type ParserContext = {
  overrideType?: string
  name?: string
}

type InvalidInputErrorOptions = {
  name: string | undefined
  expectedType: string
  reason: string
}
class InvalidInputError extends Error {
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
    if (typeof input === 'number') {
      if (Number.isNaN(input)) {
        throw new InvalidInputError({
          name: context.name,
          expectedType: 'string',
          reason: 'got NaN',
        })
      }
      input = String(input)
    }
    if (typeof input !== 'string') {
      throw new InvalidInputError({
        name: context.name,
        expectedType: 'string',
        reason: 'got ' + toType(input),
      })
    }
    if (typeof options.minLength === 'number') {
      if (input.length < options.minLength) {
        throw new InvalidInputError({
          name: context.name,
          expectedType: 'string',
          reason: 'minLength should be ' + options.minLength,
        })
      }
    }
    if (typeof options.maxLength === 'number') {
      if (input.length > options.maxLength) {
        throw new InvalidInputError({
          name: context.name,
          expectedType: 'string',
          reason: 'maxLength should be ' + options.maxLength,
        })
      }
    }
    if (options.match) {
      if (!options.match.test(input)) {
        throw new InvalidInputError({
          name: context.name,
          expectedType: 'string',
          reason: 'should match ' + options.match,
        })
      }
    }
    return input
  }
  return { parse, options }
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
      // TODO check for optional field
      if (!(key in input)) {
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
          reason: 'got ' + input,
        })
      }
    }
    return value
  }
  return { parse, expectedValue }
}
function concatName(name: string | undefined, key: string): string {
  if (name) {
    return name + '.' + key
  }
  return key
}
