function toType(input: unknown): string {
  switch (input) {
    case null:
      return 'null'
    default:
      if (Number.isNaN(input)) {
        return 'NaN'
      }
      return typeof input
  }
}

export type StringOptions = {
  minLength?: number
  maxLength?: number
}
export function string(options: StringOptions = {}) {
  function parse(input: unknown): string {
    if (typeof input === 'number') {
      if (Number.isNaN(input)) {
        throw new Error('Invalid string, got NaN')
      }
      input = String(input)
    }
    if (typeof input !== 'string') {
      throw new Error('Invalid string, got ' + toType(input))
    }
    if (typeof options.minLength === 'number') {
      if (input.length < options.minLength) {
        throw new Error(
          'Invalid string, minLength should be ' + options.minLength,
        )
      }
    }
    if (typeof options.maxLength === 'number') {
      if (input.length > options.maxLength) {
        throw new Error(
          'Invalid string, maxLength should be ' + options.maxLength,
        )
      }
    }
    return input
  }
  return { parse, options }
}

export function number() {
  function parse(input: unknown): number {
    if (typeof input === 'string') {
      input = +input
    }
    if (typeof input === 'number') {
      if (Number.isNaN(input)) {
        throw new Error('Invalid number, got NaN')
      }
      return input
    }
    throw new Error('Invalid number, got ' + toType(input))
  }
  return { parse }
}

export let float = number

export function int() {
  let parseNumber = number().parse
  function parse(input: unknown): number {
    let value = parseNumber(input)
    if (Number.isInteger(value)) {
      return value
    }
    throw new Error('Invalid number, got floating point number')
  }
  return { parse }
}
