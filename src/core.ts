export type ParseResult<T extends Parser<R>, R = unknown> = ReturnType<
  T['parse']
>

export type Parser<T> = {
  parse(input: unknown, context?: ParserContext): T
  type: string
  sampleValue: T
  randomSample: () => T
}

// used when building new data parser on top of existing parser
export type ParserContext = {
  // e.g. array parser specify "array of <type>"
  typePrefix?: string
  // e.g. array parser specify "<reason> in array"
  reasonSuffix?: string
  // e.g. url parser specify "url" when calling string parser
  overrideType?: string
  // e.g. object parser specify entry key when calling entry value parser
  name?: string
}

export type InvalidInputErrorOptions = {
  name: string | undefined
  typePrefix: string | undefined
  reasonSuffix: string | undefined
  expectedType: string
  reason: string
}
export class InvalidInputError extends TypeError {
  status: number
  statusCode: number

  constructor(options: InvalidInputErrorOptions) {
    let message = `Invalid `
    if (options.typePrefix) {
      message += options.typePrefix + ' '
    }
    message += options.expectedType
    if (options.name) {
      message += ' ' + JSON.stringify(options.name)
    }
    message += ', ' + options.reason
    if (options.reasonSuffix) {
      message += ' ' + options.reasonSuffix
    }
    super(message)
    this.status = 400
    this.statusCode = 400
  }
}

export type CustomSampleOptions<T> = {
  sampleValue?: T
  sampleValues?: T[]
  randomSample?: () => T
}

export type SampleProps<T> = {
  sampleValue: T
  randomSample: () => T
}

export function populateSampleProps<T>(options: {
  defaultProps: SampleProps<T>
  customProps: CustomSampleOptions<T> | undefined
}): SampleProps<T> {
  const { defaultProps, customProps } = options
  if (!customProps) return defaultProps
  const { sampleValue, sampleValues, randomSample } = customProps
  return {
    sampleValue:
      sampleValue !== undefined
        ? sampleValue
        : sampleValues && sampleValues.length > 0
        ? sampleValues[0]
        : randomSample
        ? randomSample()
        : defaultProps.sampleValue,
    randomSample: randomSample
      ? randomSample
      : sampleValues
      ? () => randomElement(sampleValues)
      : defaultProps.randomSample,
  }
}

function toType(input: unknown): string {
  switch (input) {
    case null:
      return 'null'
    case '':
      return 'empty string'
    case true:
      return 'boolean (true)'
    case false:
      return 'boolean (false)'
  }
  if (Number.isNaN(input)) {
    return 'NaN'
  }
  if (Array.isArray(input)) {
    return 'array'
  }
  if (input instanceof Date) {
    return 'date'
  }
  return typeof input
}

export type StringOptions = {
  nonEmpty?: boolean
  minLength?: number
  maxLength?: number
  match?: RegExp
  trim?: boolean // default true
}
export function string(
  options: StringOptions & CustomSampleOptions<string> = {},
) {
  function parse(input: unknown, context: ParserContext = {}): string {
    let expectedType = context.overrideType || 'string'
    if (options.trim !== false && typeof input === 'string') {
      input = input.trim()
    }
    if (options.nonEmpty) {
      if (!expectedType.startsWith('non-empty ')) {
        expectedType = 'non-empty ' + expectedType
      }
      if (input === '') {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'got empty string',
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    if (typeof input === 'number') {
      if (Number.isNaN(input)) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'got NaN',
          reasonSuffix: context.reasonSuffix,
        })
      }
      input = String(input)
    }
    if (typeof input !== 'string') {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'got ' + toType(input),
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (typeof options.minLength === 'number') {
      if (input.length < options.minLength) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'minLength should be ' + options.minLength,
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    if (typeof options.maxLength === 'number') {
      if (input.length > options.maxLength) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'maxLength should be ' + options.maxLength,
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    if (options.match) {
      if (!options.match.test(input)) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'should match ' + options.match,
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    return input
  }
  return {
    parse,
    options,
    type: 'string',
    ...populateSampleProps({
      defaultProps: {
        sampleValue: 'text',
        randomSample: () => Math.random().toString(36).slice(2),
      },
      customProps: options,
    }),
  }
}

let urlRegex = /^(.+?):\/\/(.+?)(\/|$)/
export type UrlOptions = StringOptions & {
  domain?: string
  protocol?: string
  protocols?: string[]
}
export function url(options: UrlOptions & CustomSampleOptions<string> = {}) {
  let parser = string(options)
  function parse(input: unknown, context: ParserContext = {}): string {
    if (!options.nonEmpty && input === '') return ''
    let expectedType = context.overrideType || 'url'
    let url = parser.parse(input, {
      ...context,
      overrideType: expectedType,
    })
    let match = url.match(urlRegex)
    if (!match) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'should contains protocol and domain/host',
        reasonSuffix: context.reasonSuffix,
      })
    }
    let protocol = match[1]
    let domain = match[2]
    if (
      Array.isArray(options.protocols) &&
      !options.protocols.includes(protocol)
    ) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason:
          'protocol should be any of ' + JSON.stringify(options.protocols),
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (typeof options.protocol === 'string' && protocol !== options.protocol) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'protocol should be ' + JSON.stringify(options.protocol),
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (typeof options.domain === 'string' && domain !== options.domain) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'domain should be ' + JSON.stringify(options.domain),
        reasonSuffix: context.reasonSuffix,
      })
    }
    return url
  }
  return {
    parse,
    options,
    type: 'string',
    ...populateSampleProps({
      defaultProps: defaultUrlSampleProps,
      customProps: options,
    }),
  }
}
const defaultUrlSampleProps: SampleProps<string> = {
  sampleValue: 'https://www.example.net',
  randomSample: () => 'https://www.example.net/users/' + randomId(),
}

let emailRegex = /^.+?@(.+)$/
export type EmailOptions = StringOptions & {
  domain?: string
}
export function email(
  options: EmailOptions & CustomSampleOptions<string> = {},
) {
  let parser = string(options)
  function parse(input: unknown, context: ParserContext = {}): string {
    if (!options.nonEmpty && input === '') return ''
    let expectedType = context.overrideType || 'email'
    let email = parser.parse(input, {
      ...context,
      overrideType: expectedType,
    })
    let match = email.match(emailRegex)
    if (!match) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'should contains "@" and domain',
        reasonSuffix: context.reasonSuffix,
      })
    }
    let domain = match[1]
    if (typeof options.domain === 'string' && domain !== options.domain) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'domain should be ' + JSON.stringify(options.domain),
        reasonSuffix: context.reasonSuffix,
      })
    }
    return email
  }
  return {
    parse,
    options,
    type: 'string',
    ...populateSampleProps({
      defaultProps: defaultEmailSampleProps,
      customProps: options,
    }),
  }
}
const defaultEmailSampleProps: SampleProps<string> = {
  sampleValue: 'user@example.net',
  randomSample: () => 'user-' + randomId() + '@example.net',
}

let colorRegex = /^#[0-9a-f]{6}$/i
/** @description for parsing <input type="color"> in html form submission */
export function color(options?: CustomSampleOptions<string>) {
  function parse(input: unknown, context: ParserContext = {}): string {
    let expectedType = context.overrideType || 'color'
    if (typeof input !== 'string' || !input) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'got ' + toType(input),
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (!input.match(colorRegex)) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'should be in "#rrggbb" hexadecimal format',
        reasonSuffix: context.reasonSuffix,
      })
    }
    return input
  }
  return {
    parse,
    type: 'string',
    ...populateSampleProps({
      defaultProps: defaultColorSampleProps,
      customProps: options,
    }),
  }
}
const defaultColorSampleProps: SampleProps<string> = {
  sampleValue: '#c0ffee',
  randomSample: () =>
    '#' +
    randomHex() +
    randomHex() +
    randomHex() +
    randomHex() +
    randomHex() +
    randomHex(),
}

export type NumberOptions = {
  min?: number
  max?: number
}
export function number(
  options: NumberOptions & CustomSampleOptions<number> = {},
) {
  function parse(input: unknown, context: ParserContext = {}): number {
    let expectedType = context.overrideType || 'number'
    let type = toType(input)
    if (typeof input === 'string') {
      input = +input
    }
    if (typeof input !== 'number') {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'got ' + type,
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (Number.isNaN(input)) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'got ' + type,
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (typeof options.min === 'number') {
      if (input < options.min) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'min value should be ' + options.min,
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    if (typeof options.max === 'number') {
      if (input > options.max) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'max value should be ' + options.max,
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    return input
  }
  return {
    parse,
    options,
    type: 'number',
    ...populateSampleProps({
      defaultProps: {
        sampleValue: 3.14,
        randomSample: () => randomDelta(10),
      },
      customProps: options,
    }),
  }
}

export type FloatOptions = NumberOptions & {
  toFixed?: number
  toPrecision?: number
}
export function float(
  options: FloatOptions & CustomSampleOptions<number> = {},
) {
  let parser = number(options)
  function parse(input: unknown, context: ParserContext = {}): number {
    let value: number = parser.parse(input, {
      ...context,
      overrideType: context.overrideType || 'float',
    })
    if (typeof options.toFixed === 'number') {
      value = +value.toFixed(options.toFixed)
    }
    if (typeof options.toPrecision === 'number') {
      value = +value.toPrecision(options.toPrecision)
    }
    return value
  }
  return {
    parse,
    options,
    type: 'number',
    ...populateSampleProps({
      defaultProps: defaultFloatSampleProps,
      customProps: options,
    }),
  }
}
const defaultFloatSampleProps: SampleProps<number> = {
  sampleValue: 3.14,
  randomSample: () => Math.random(),
}

export function int(options: NumberOptions & CustomSampleOptions<number> = {}) {
  let parseNumber = number(options).parse
  function parse(input: unknown, context: ParserContext = {}): number {
    let expectedType = context.overrideType || 'int'
    let value = parseNumber(input, {
      ...context,
      overrideType: expectedType,
    })
    if (Number.isInteger(value)) {
      return value
    }
    throw new InvalidInputError({
      name: context.name,
      typePrefix: context.typePrefix,
      expectedType,
      reason: 'got floating point number',
      reasonSuffix: context.reasonSuffix,
    })
  }
  return {
    parse,
    options,
    type: 'number',
    ...populateSampleProps({
      defaultProps: {
        sampleValue: 42,
        randomSample: () => randomId() - 50,
      },
      customProps: options,
    }),
  }
}

export type ObjectFieldParsers<T extends object> = {
  [P in keyof T]: Parser<T[P]>
}
/** @deprecated renamed to ObjectFieldParsers */
export type ObjectOptions<T extends object> = ObjectFieldParsers<T>

export function object<T extends object>(
  fieldParsers: ObjectFieldParsers<T> = {} as any,
  options?: CustomSampleOptions<T>,
) {
  function parse(input: unknown, context: ParserContext = {}): T {
    let name = context.name
    let expectedType = context.overrideType || 'object'
    if (input === null) {
      throw new InvalidInputError({
        name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'got null',
        reasonSuffix: context.reasonSuffix,
      })
    }
    if (typeof input !== 'object') {
      throw new InvalidInputError({
        name,
        typePrefix: context.typePrefix,
        expectedType,
        reason: 'got ' + toType(input),
        reasonSuffix: context.reasonSuffix,
      })
    }
    let object: T = {} as any
    for (let key in fieldParsers) {
      let valueParser = fieldParsers[key]
      if (!(key in input)) {
        if (isOptional(valueParser)) {
          continue
        }
        if (isCheckbox(valueParser)) {
          object[key] = false as any
          continue
        }
        throw new InvalidInputError({
          name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'missing ' + JSON.stringify(key),
          reasonSuffix: context.reasonSuffix,
        })
      }
      let valueInput = input[key as keyof typeof input]
      if (valueInput == null && isOptional(valueParser)) {
        continue
      }
      let value = valueParser.parse(valueInput, {
        name: name ? name + '.' + key : key,
      })
      object[key] = value
    }
    return object
  }

  function getDefaultSampleValue(): T {
    let sampleValue: Record<string, any>
    if (options && options.sampleValue) {
      sampleValue = options.sampleValue
    } else if (
      options &&
      options.sampleValues &&
      options.sampleValues.length > 0
    ) {
      sampleValue = options.sampleValues[0]
    } else if (options && options.randomSample) {
      sampleValue = options.randomSample()
    } else {
      sampleValue = {}
      for (let key in fieldParsers) {
        let parser = fieldParsers[key]
        sampleValue[key] =
          parser.sampleValue !== undefined
            ? parser.sampleValue
            : parser.randomSample?.()
      }
    }
    return sampleValue as T
  }

  function defaultRandomSample(): T {
    let sampleValue: Record<string, any> = {}
    for (let key in fieldParsers) {
      let parser = fieldParsers[key]
      sampleValue[key] = parser.randomSample?.()
    }
    return sampleValue as T
  }

  let type: string
  function getType(): string {
    if (type) return type
    type = '{'
    for (let key in fieldParsers) {
      let valueParser = fieldParsers[key]
      let value = valueParser.sampleValue
      let valueType = valueParser.type || typeof value
      valueType = valueType.replace(/\n/g, '\n  ')
      if (isOptional(valueParser)) {
        type += `\n  ${key}?: ${valueType}`
      } else {
        type += `\n  ${key}: ${valueType}`
      }
    }
    type += '\n}'
    return type
  }

  return {
    parse,
    options: fieldParsers,
    get type() {
      return getType()
    },
    ...populateSampleProps({
      defaultProps: {
        get sampleValue() {
          return getDefaultSampleValue()
        },
        randomSample: defaultRandomSample,
      },
      customProps: options,
    }),
  }
}

export function optional<T>(parser: Parser<T>): Parser<T | undefined> {
  return Object.assign(parser, { optional: true })
}

function isOptional(parser: Parser<unknown>): boolean {
  return (parser as any).optional
}

export function nullable<T>(
  parser: Parser<T>,
  options?: CustomSampleOptions<T | null>,
) {
  function parse(input: unknown, context: ParserContext = {}): T | null {
    if (input === null) return null
    let typePrefix = context.typePrefix
    return parser.parse(input, {
      ...context,
      typePrefix: typePrefix ? 'nullable ' + typePrefix : 'nullable',
    })
  }
  let type = getParserType(parser)
  if (isSimpleType(type)) {
    type = `null | ${type}`
  } else {
    type = `null | (${type})`
  }
  return {
    parse,
    parser,
    type,
    ...populateSampleProps({
      defaultProps: {
        sampleValue: null,
        randomSample: () =>
          Math.random() < 0.5 ? null : parser.randomSample?.(),
      },
      customProps: options,
    }),
  }
}

export function boolean(expectedValue?: boolean) {
  if (expectedValue !== undefined) {
    expectedValue = !!expectedValue
  }
  function parse(input: unknown, context: ParserContext = {}): boolean {
    let expectedType =
      context.overrideType ||
      (typeof expectedValue === 'boolean'
        ? `boolean (expect: ${expectedValue})`
        : 'boolean')
    let value = parseBooleanString(input)
    if (typeof expectedValue === 'boolean') {
      if (value !== expectedValue) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'got ' + toType(input),
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    return value
  }
  return {
    parse,
    expectedValue,
    type: 'boolean',
    sampleValue: true,
    randomSample: () => Math.random() < 0.5,
  }
}
function parseBooleanString(input: unknown): boolean {
  if (typeof input === 'string') {
    input = input.trim()
  }
  switch (input) {
    case 'false':
      return false
    default:
      return !!input
  }
}

/** @description for parsing <input type="checkbox"> in html form submission */
export function checkbox(options?: CustomSampleOptions<boolean>) {
  function parse(input: unknown, context: ParserContext = {}): boolean {
    let expectedType = context.overrideType || 'checkbox'
    switch (input) {
      case 'on':
        return true
      case undefined:
      case '':
        return false
      default:
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'got ' + toType(input),
          reasonSuffix: context.reasonSuffix,
        })
    }
  }
  return {
    parse,
    checkbox: true,
    type: 'boolean',
    ...populateSampleProps({
      defaultProps: {
        sampleValue: true,
        randomSample: () => Math.random() < 0.5,
      },
      customProps: options,
    }),
  }
}

function isCheckbox(parser: Parser<unknown>): boolean {
  return (parser as any).checkbox
}

export type DateOptions = {
  min?: number | Date | string
  max?: number | Date | string
}
export function date(options: DateOptions & CustomSampleOptions<Date> = {}) {
  function parse(input: unknown, context: ParserContext = {}): Date {
    let expectedType = context.overrideType || 'date'
    function checkDate(value: Date): Date {
      let time = value.getTime()
      if (Number.isNaN(time)) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'got ' + toType(input),
          reasonSuffix: context.reasonSuffix,
        })
      }
      let rangeNameSuffix = ' of ' + (context.name || 'date')
      if (options.min !== undefined) {
        let min = parseDate(options.min, {
          name: 'min value' + rangeNameSuffix,
        }).getTime()
        if (time < min) {
          throw new InvalidInputError({
            name: context.name,
            typePrefix: context.typePrefix,
            expectedType,
            reason: 'min value should be ' + JSON.stringify(options.min),
            reasonSuffix: context.reasonSuffix,
          })
        }
      }
      if (options.max !== undefined) {
        let max = parseDate(options.max, {
          name: 'max value' + rangeNameSuffix,
        }).getTime()
        if (time > max) {
          throw new InvalidInputError({
            name: context.name,
            typePrefix: context.typePrefix,
            expectedType,
            reason: 'max value should be ' + JSON.stringify(options.max),
            reasonSuffix: context.reasonSuffix,
          })
        }
      }
      return value
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
      typePrefix: context.typePrefix,
      expectedType,
      reason: 'got ' + toType(input),
      reasonSuffix: context.reasonSuffix,
    })
  }
  return {
    parse,
    options,
    type: 'Date',
    ...populateSampleProps({
      defaultProps: defaultDateSampleProps,
      customProps: options,
    }),
  }
}
const defaultDateSampleProps: SampleProps<Date> = {
  sampleValue: new Date('2022-09-17'),
  randomSample: () => {
    let date = new Date()
    date.setFullYear(date.getFullYear() + randomDelta(10))
    date.setMonth(date.getMonth() + randomDelta(6))
    date.setDate(date.getDate() + randomDelta(15))
    return date
  },
}
let parseDate = date().parse

export type DateStringOptions = {
  nonEmpty?: boolean
  min?: number | Date | string
  max?: number | Date | string
}
/**
 * @description parse date string in format 'yyyy-mm-dd' from Date | string | number
 */
export function dateString(
  options: DateStringOptions & CustomSampleOptions<string> = {},
) {
  let dateParser = date()
  let stringParser = string({ trim: true, nonEmpty: options.nonEmpty })
  function parse(input: unknown, context: ParserContext = {}): string {
    if (!options.nonEmpty && input == '') return ''
    let expectedType = context.overrideType || 'dateString'
    if (typeof input == 'string') {
      input = stringParser.parse(input, {
        ...context,
        overrideType: expectedType,
      })
    }
    let date = dateParser.parse(input, {
      ...context,
      overrideType: expectedType,
    })
    let dateString = toDateString(date)
    let rangeNameSuffix = ' of ' + (context.name || 'dateString')
    if (options.min !== undefined) {
      let min = parseDateString(options.min, {
        name: 'min value' + rangeNameSuffix,
      })
      if (dateString < min) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'min value should be ' + JSON.stringify(options.min),
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    if (options.max !== undefined) {
      let max = parseDateString(options.max, {
        name: 'max value' + rangeNameSuffix,
      })
      if (dateString > max) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'max value should be ' + JSON.stringify(options.max),
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    return dateString
  }
  return {
    parse,
    options,
    type: 'string',
    ...populateSampleProps({
      defaultProps: defaultDateStringSampleProps,
      customProps: options,
    }),
  }
}
const defaultDateStringSampleProps: SampleProps<string> = {
  sampleValue: '2022-09-17',
  randomSample: () => {
    let date = new Date()
    date.setFullYear(date.getFullYear() + randomDelta(10))
    date.setMonth(date.getMonth() + randomDelta(6))
    date.setDate(date.getDate() + randomDelta(15))
    return toDateString(date)
  },
}
let parseDateString = dateString().parse
export function toDateString(date: Date): string {
  let y = d2(date.getFullYear())
  let m = d2(date.getMonth() + 1)
  let d = d2(date.getDate())
  return `${y}-${m}-${d}`
}
/**
 * @description add a leading '0' padding when the number is single digit
 */
export function d2(number: number): string | number {
  return number < 10 ? '0' + number : number
}

export type TimeStringOptions = {
  nonEmpty?: boolean
  min?: number | Date | string
  max?: number | Date | string
}
/**
 * @description parse time string in format 'hh:mm' from Date | string
 */
export function timeString(
  options: TimeStringOptions & CustomSampleOptions<string> = {},
) {
  let dateParser = date({ min: options.min, max: options.max })
  let stringParser = string({ trim: true, nonEmpty: options.nonEmpty })
  function parse(input: unknown, context: ParserContext = {}): string {
    if (!options.nonEmpty && input == '') return ''
    let expectedType = context.overrideType || 'timeString'
    let timeString: string
    if (typeof input === 'string' && input.includes('T')) {
      input = new Date(input)
    }
    if (typeof input === 'string') {
      let string = stringParser.parse(input, {
        ...context,
        overrideType: expectedType,
      })
      let match = string.match(/(\d{1,2}:\d{1,2})/)
      if (!match) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'got string ' + JSON.stringify(input),
          reasonSuffix: context.reasonSuffix,
        })
      }
      timeString = match[1]
    } else {
      let date = dateParser.parse(input, {
        ...context,
        overrideType: expectedType,
      })
      timeString = toTimeString(date)
    }
    let rangeNameSuffix = ' of ' + (context.name || 'timeString')
    if (options.min !== undefined) {
      let min = parseTimeString(options.min, {
        name: 'min value' + rangeNameSuffix,
      })
      if (timeString < min) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'min value should be ' + JSON.stringify(options.min),
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    if (options.max !== undefined) {
      let max = parseTimeString(options.max, {
        name: 'max value' + rangeNameSuffix,
      })
      if (timeString > max) {
        throw new InvalidInputError({
          name: context.name,
          typePrefix: context.typePrefix,
          expectedType,
          reason: 'max value should be ' + JSON.stringify(options.max),
          reasonSuffix: context.reasonSuffix,
        })
      }
    }
    return timeString
  }
  return {
    parse,
    options,
    type: 'string',
    ...populateSampleProps({
      defaultProps: defaultTimeStringSampleProps,
      customProps: options,
    }),
  }
}
const defaultTimeStringSampleProps: SampleProps<string> = {
  sampleValue: '13:45',
  randomSample: () => {
    let date = new Date()
    date.setHours(date.getHours() + randomDelta(12))
    date.setMinutes(date.getMinutes() + randomDelta(30))
    return toTimeString(date)
  },
}
let parseTimeString = timeString().parse
export function toTimeString(date: Date): string {
  let h = d2(date.getHours())
  let m = d2(date.getMinutes())
  return `${h}:${m}`
}

export function literal<T>(value: T) {
  function parse(input: unknown, context: ParserContext = {}): T {
    if (input === value) return value
    let expectedType =
      context.overrideType || 'literal ' + JSON.stringify(value)
    throw new InvalidInputError({
      name: context.name,
      typePrefix: context.typePrefix,
      expectedType,
      reason: 'got ' + toType(input),
      reasonSuffix: context.reasonSuffix,
    })
  }
  return {
    parse,
    value,
    type: JSON.stringify(value),
    sampleValue: value,
    randomSample: () => value,
  }
}

/** @description inspired from zod */
export type Primitive =
  | string
  | number
  | symbol
  | bigint
  | boolean
  | null
  | undefined

/** @alias `enums` */
export function values<T extends Primitive>(
  values: T[],
  options?: CustomSampleOptions<T>,
) {
  function parse(input: unknown, context: ParserContext = {}): T {
    for (let value of values) {
      if (input === value) return value
    }
    let expectedType =
      context.overrideType ||
      (context.name
        ? 'enums value of ' + JSON.stringify(context.name)
        : 'enums value') +
        ', expect ' +
        JSON.stringify(values)
    throw new InvalidInputError({
      name: undefined,
      typePrefix: context.typePrefix,
      expectedType,
      reason:
        'got ' +
        (typeof input == 'number'
          ? input
          : typeof input == 'string' && input.length > 0
          ? JSON.stringify(input)
          : toType(input)),
      reasonSuffix: context.reasonSuffix,
    })
  }
  return {
    parse,
    values,
    type: values.map(value => JSON.stringify(value)).join(' | '),
    ...populateSampleProps({
      defaultProps: {
        sampleValue: values[0],
        randomSample: () => randomElement(values),
      },
      customProps: options,
    }),
  }
}

/** @alias `values` */
export let enums = values

export type ArrayOptions = {
  minLength?: number
  maxLength?: number
  maybeSingle?: boolean // to handle variadic value (e.g. req.query.category)
}
export function array<T>(
  parser: Parser<T>,
  options: ArrayOptions & CustomSampleOptions<T[]> = {},
) {
  function parse(input: unknown, context: ParserContext = {}): T[] {
    let { typePrefix, reasonSuffix } = context
    let expectedType = context.overrideType || 'array'
    if (!Array.isArray(input) && options.maybeSingle) {
      input = [input]
    }
    if (!Array.isArray(input)) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix,
        expectedType,
        reason: 'got ' + toType(input),
        reasonSuffix,
      })
    }
    if (
      typeof options.minLength === 'number' &&
      input.length < options.minLength
    ) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix,
        expectedType,
        reason: 'minLength should be ' + options.minLength,
        reasonSuffix,
      })
    }
    if (
      typeof options.maxLength === 'number' &&
      input.length > options.maxLength
    ) {
      throw new InvalidInputError({
        name: context.name,
        typePrefix,
        expectedType,
        reason: 'maxLength should be ' + options.maxLength,
        reasonSuffix,
      })
    }
    let values: T[] = []
    for (let element of input) {
      let value = parser.parse(element, {
        ...context,
        typePrefix: concat('array of', typePrefix),
        reasonSuffix: concat(reasonSuffix, 'in array'),
      })
      values.push(value)
    }
    return values
  }
  return {
    parse,
    parser,
    options,
    type: `Array<${getParserType(parser)}>`,
    ...populateSampleProps({
      defaultProps: {
        sampleValue: [parser.sampleValue],
        randomSample() {
          return [parser.randomSample?.()]
        },
      },
      customProps: options,
    }),
  }
}

/** @description unwrap formidable field value from `T[]` to `T` */
export function singletonArray<T>(valueParser: Parser<T>): Parser<T> {
  let arrayParser = array(valueParser, { minLength: 1, maxLength: 1 })
  function parse(input: unknown, context?: ParserContext): T {
    let array = arrayParser.parse(input, {
      ...context,
      overrideType: context?.overrideType || 'singletonArray',
    })
    return array[0]
  }
  return {
    parse,
    type: valueParser.type,
    sampleValue: valueParser.sampleValue,
    randomSample: valueParser.randomSample,
  }
}

/**
 * @description for parsing database auto-increment primary key
 */
export function id(options?: CustomSampleOptions<number>) {
  let parseInt = int({ min: 1 }).parse
  function parse(input: unknown, context: ParserContext = {}): number {
    return parseInt(input, { ...context, overrideType: 'id' })
  }
  return {
    parse,
    type: 'number',
    ...populateSampleProps({
      defaultProps: defaultIdSampleProps,
      customProps: options,
    }),
  }
}
const defaultIdSampleProps: SampleProps<number> = {
  sampleValue: 1,
  randomSample: randomId,
}

function randomId() {
  return Math.floor(Math.random() * 100 + 1)
}

function randomDelta(range: number) {
  return (Math.random() * 2 - 1) * range
}

function randomHex() {
  return Math.floor(Math.random() * 16).toString(16)
}

function randomElement<T>(elements: T[]): T {
  if (randomElement.length === 0) {
    throw new Error('Cannot pick random element from empty array')
  }
  let index = Math.floor(Math.random() * elements.length)
  return elements[index]
}

function concat(
  a: string | undefined,
  b: string | undefined,
): string | undefined {
  if (a && b) {
    return a + ' ' + b
  }
  return a || b
}

export function getParserType(parser: Partial<Parser<any>>): string {
  if (parser.type) return parser.type
  if ('sampleValue' in parser) return typeof parser.sampleValue
  if (parser.randomSample) return typeof parser.randomSample()
  return 'unknown'
}

function isSimpleType(type: string): boolean {
  return !!type.match(/^\w+$/)
}

type InferEnumsField<O> = {
  [P in keyof O as P extends `${string}$enums${string}`
    ? never
    : P extends `${string}$enum${string}`
    ? never
    : P]: O[P]
} & {
  [P in keyof O as P extends `${infer H}$enums${infer T}`
    ? `${H}${T}`
    : P extends `${infer H}$enum${infer T}`
    ? `${H}${T}`
    : never]: O[P] extends Array<infer V> ? V : O[P]
}

type InferNullableField<O> = {
  [P in keyof O as P extends `${string}$nullable${string}`
    ? never
    : P extends `${string}$null${string}`
    ? never
    : P]: InferType<O[P]>
} & {
  [P in keyof O as P extends `${infer H}$nullable${infer T}`
    ? `${H}${T}`
    : P extends `${infer H}$null${infer T}`
    ? `${H}${T}`
    : never]: null | InferType<O[P]>
}

type InferOptionalField<O> = {
  [P in keyof O as P extends `${string}$optional${string}`
    ? never
    : P extends `${string}?${string}`
    ? never
    : P]: InferType<O[P]>
} & {
  [P in keyof O as P extends `${infer H}$optional${infer T}`
    ? `${H}${T}`
    : P extends `${infer H}?${infer T}`
    ? `${H}${T}`
    : never]?: InferType<O[P]>
}

type InferObjectType<T> = InferOptionalField<
  InferNullableField<InferEnumsField<T>>
>

type InferType<T> = T extends Array<infer E>
  ? Array<InferType<E>>
  : T extends {}
  ? InferObjectType<T>
  : T

export function inferFromSampleValue<T>(value: T): Parser<InferType<T>> {
  if (typeof value == 'string')
    return string({ sampleValue: value }) as Parser<string> as Parser<
      InferType<T>
    >
  if (typeof value == 'number')
    return Number.isInteger(value)
      ? (int({ sampleValue: value }) as Parser<number> as Parser<InferType<T>>)
      : Math.round(value) != value
      ? (float({ sampleValue: value }) as Parser<number> as Parser<
          InferType<T>
        >)
      : (number({ sampleValue: value }) as Parser<number> as Parser<
          InferType<T>
        >)
  if (typeof value == 'boolean')
    return boolean() as Parser<boolean> as Parser<InferType<T>>
  if (value instanceof Date)
    return date({ sampleValue: value }) as Parser<Date> as Parser<InferType<T>>
  if (Array.isArray(value))
    return array(inferFromSampleValue(value[0])) as Parser<
      Array<any>
    > as Parser<InferType<T>>
  if (value != null && typeof value == 'object') {
    let fieldParserEntries: [string, Parser<any>][] = []
    for (let field in value) {
      let val = value[field]
      let parser: Parser<any>
      let is_nullable = false
      let is_optional = false
      for (;;) {
        if (Array.isArray(val)) {
          if (field.endsWith('$enums')) {
            field = field.slice(0, field.length - '$enums'.length) as any
            parser = values(val, { sampleValues: val })
            continue
          }
          if (field.endsWith('$enum')) {
            field = field.slice(0, field.length - '$enum'.length) as any
            parser = values(val, { sampleValues: val })
            continue
          }
        }
        if (field.endsWith('$nullable')) {
          field = field.slice(0, field.length - '$nullable'.length) as any
          is_nullable = true
          continue
        }
        if (field.endsWith('$null')) {
          field = field.slice(0, field.length - '$null'.length) as any
          is_nullable = true
          continue
        }
        if (field.endsWith('$optional')) {
          field = field.slice(0, field.length - '$optional'.length) as any
          is_optional = true
          continue
        }
        if (field.endsWith('?')) {
          field = field.slice(0, field.length - 1) as any
          is_optional = true
          continue
        }
        break
      }
      parser ||= inferFromSampleValue(val)
      if (is_nullable) {
        parser = nullable(parser)
      }
      if (is_optional) {
        parser = optional(parser)
      }
      fieldParserEntries.push([field, parser])
    }
    return object(
      Object.fromEntries(fieldParserEntries) as ObjectFieldParsers<any>,
      {
        sampleValue: value,
      },
    ) as Parser<object> as Parser<InferType<T>>
  }
  throw new Error('unsupported sample value: ' + JSON.stringify(value))
}
