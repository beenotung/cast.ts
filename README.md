<p align="center">
  <a href="https://cloudflare-ipfs.com/ipfs/QmQvhfV87eeKiRs3kchR5ytZBXJ4Lvd5nTF2edhxEW1G8V" title="click to see HD logo of cast.ts">
    <img src="logo.jpg" width="200px" align="center" alt="cat.ts logo" />
  </a>
  <h1 align="center">cast.ts</h1>
  <p align="center">
    Compose validation parsers with static type inference; or
    <br/>
    Auto-infer parsers from sample values
    <br/>
    cast.ts makes it easy to handle data from RESTful API
  </p>
</p>

[![npm Package Version](https://img.shields.io/npm/v/cast.ts)](https://www.npmjs.com/package/cast.ts)
[![Minified Package Size](https://img.shields.io/bundlephobia/min/cast.ts)](https://bundlephobia.com/package/cast.ts)
[![Minified and Gzipped Package Size](https://img.shields.io/bundlephobia/minzip/cast.ts)](https://bundlephobia.com/package/cast.ts)

Inspired by [Zod](https://github.com/colinhacks/zod) and [tRPC](https://github.com/trpc/trpc) with automatic type conversion, type reflection, sample values and auto-infer from sample value.

## Feature Highlights

- Explicit type conversion
- Right-to-the-point error message
- Static type inference
- Composable: builder functions (i.e. `optional()`) return new parser instance
- Convenience: support auto-infer parser from from sample value
- Safe: [Parse, don't type-check](https://news.ycombinator.com/item?id=25220139)
- Tiny: below 2kB minizipped
- Zero dependencies
- Isomorphic Package: works in Node.js and browsers
- Works with plain Javascript, Typescript is not mandatory
- Extensible: support meta-programming with type reflection and sample values

## Introduction

cast.ts is an isomorphic package, it runs in both node.js and browsers.

You can use cast.ts to check against request data on the server, and also response data on the client. This double-checking approach add a safe layer between the interface (API) of separately implemented frontend and backend for easier debugging with specific error message and better security and maintainability.

Bonus: cast.ts also supports static type inference in Typescript project.

## Installation

```bash
npm install cast.ts
```

You can also install cast.ts with `pnpm`, `yarn`, or `slnpm`

## Usage Example

You can compose a parser by composing a wide range of parser builders, or auto infer a parser from sample value.

### Composing Parsers

```typescript
import { optional, object, int, array, id, string } from 'cast.ts'

let searchQuery = object({
  page: optional(int({ min: 1 })),
  count: optional(int({ max: 25 })),
  cat: optional(array(id(), { maybeSingle: true })),
  keyword: string({ minLength: 3 }),
})

type SearchQuery = ParseResult<typeof searchQuery>
// the inferred type of parse result will be like below
type SearchQuery = {
  page?: number
  count?: number
  cat: number[]
  keyword: string
}

// Example: http://localhost:8100/product/search?page=2&count=20&keyword=food&cat=12&cat=18
app.get('/product/search', async (req, res) => {
  // query is validated with inferred type
  let query = searchQuery.parse(req.query)
  console.log(query)
  // { page: 2, count: 20, cat: [ 12, 18 ], keyword: 'food' }
})
```

Noted that the parsed `page`, `count` are numbers, and the `cat` is array of numbers, instead of being string and array of strings in the original `req.query` from express router.

If the validation is not successful, the parser will throw an `InvalidInputError`. You can surround the call with try-catch to response specific error message to the client.

A full list of built-in parsers are documented in the [Supported Parsers](#supported-parsers) section below.

For more complete example, see [examples/server.ts](./examples/server.ts)

### Infer from Sample Value

You can use `inferFromSampleValue()` to auto-infer the parser based on given sample value.

Usage example:

```typescript
import { inferFromSampleValue } from 'cast.ts'

let parser = inferFromSampleValue({
  postList: [
    {
      id: 1,
      title: 'Hello World',
      type$enums: ['public', 'vip'],
      hidden$optional: true,
    },
  ],
})
let input = parser.parse(req.body)
/* the type of parsed input is inferred as:
{
  postList: Array<{
    id: number
    title: string
    type: 'public' | 'vip'
    hidden?: boolean
  }>
}
*/
```

Supported field name decorators (suffix): `$enums` (alias: `$enum`), `$nullable` (alias: `$null`), `$optional` (alias: `?`).

The field name decorators can be used in combination in any order.

## Supported Parsers

- primary parsers
  - [string](#string)
  - [number](#number)
  - [int](#int)
  - [float](#float)
  - [id](#id) (alias of `int({ min: 1 })`)
  - [boolean](#boolean)
  - [checkbox](#checkbox)
  - [color](#color)
  - [object](#object)
  - [date](#date)
  - [dateString](#datestring) (string in format `yyyy-mm-dd`)
  - [timeString](#timestring) (string in format `hh:mm`)
  - [url](#url)
  - [email](#email)
  - [literal](#literal)
  - [values/enums](#values--enums)
- decorator (wrapping primary parsers)
  - [array](#array)
  - [singletonArray](#singletonarray) (for formidable v3+)
  - [nullable](#nullable)
  - [optional](#optional) (for object fields)
  - [or/union](#or--union) (for union type)
  - [dict/record](#dict--record) (for key-value pairs)

## Parser Types and Usage Examples

**Utility type**:

```typescript
// to extract inferred type of parsed payload
type ParseResult<T extends Parser<R>, R = unknown> = ReturnType<T['parse']>
```

**Reference types**:

```typescript
type Parser<T> = {
  parse(input: unknown, context?: ParserContext): T
  type: string // typescript signature of parsed value
  sampleValue: T
  randomSample: () => T
}

// used when building new data parser on top of existing parser
type ParserContext = {
  // e.g. array parser specify "array of <type>"
  typePrefix?: string
  // e.g. array parser specify "<reason> in array"
  reasonSuffix?: string
  // e.g. url parser specify "url" when calling string parser
  overrideType?: string
  // e.g. object parser specify entry key when calling entry value parser
  name?: string
}
```

**For custom parsers**:

If you want to implement custom parser you may reuse the `InvalidInputError` error class. The argument options is listed below:

```typescript
class InvalidInputError extends Error {
  status: number // alias of statusCode
  statusCode: number // default 400
  constructor(options: InvalidInputErrorOptions) {
    let message = '...'
    super(message)
  }
}
type InvalidInputErrorOptions = {
  name: string | undefined
  typePrefix: string | undefined
  reasonSuffix: string | undefined
  expectedType: string
  reason: string
}
```

In addition, you may use the `populateSampleProps` helper function when constructing custom parser. The type signature is listed below:

```typescript
function populateSampleProps<T>(options: {
  defaultProps: SampleProps<T>
  customProps?: CustomSampleOptions<T>
}): SampleProps<T>

type SampleProps<T> = {
  sampleValue: T
  randomSample: () => T
}

type CustomSampleOptions<T> = {
  sampleValue?: T
  sampleValues?: T[]
  randomSample?: () => T
}
```

## String

**Usage Example**:

```typescript
// keyword is a string potentially being empty
let keyword = string().parse(req.query.keyword)

// username is an non-empty string
let username = string({ minLength: 3, maxLength: 32 }).parse(req.body.username)
```

**Options of string parser**:

```typescript
type StringOptions = {
  nonEmpty?: boolean
  minLength?: number
  maxLength?: number
  match?: RegExp
  trim?: boolean // default true
}
```

## Number

**Example**:

```typescript
// score is a non-NaN number
let score = number().parse(req.body.score)

// height is a non-negative number
let height = number({ min: 0 }).parse(req.body.height)

// stars is a non-NaN number
let stars = number({ readable: true }).parse('3.5k')

// tel is a number (85298765432)
let tel = number({ readable: true }).parse('852 9876-5432')

// amount is a number (123456)
let amount = number({ readable: true }).parse('123,456.00')
```

**Options of number parser**:

```typescript
type NumberOptions = {
  min?: number
  max?: number
  /** @description turn `"3.5k"` into `3500` if enabled */
  readable?: boolean
  /** @example `"tr"` to treat `3,14` as `3.14` if `readable` is true */
  locale?: string
  /**
   * @description round `0.1 + 0.2` into `0.3` if enabled
   * @default true
   * */
  nearest?: boolean
}
```

## Float

**Example**:

```typescript
// degree is a real number (non-NaN, non-infinite)
let degree = float().parse(req.body.degree)

// height is a real number with at most 2 digits after the decimal point
let height = float({ toFixed: 2 }).parse(req.body.height)

// weight is a real number with at most 3 significant digits
let weight = float({ toPrecision: 2 }).parse(req.body.weight)

// score is a real number between 0 and 100 inclusively
let score = float({ min: 0, max: 100 })
```

**Options of number parser**:

```typescript
type FloatOptions = NumberOptions & {
  toFixed?: number
  toPrecision?: number
}
```

## Int

**Usage Example**:

```typescript
// score is an integer between 1 to 5
let rating = int({ min: 1, max: 5 }).parse(req.body.rating)
```

**Options of int parser**: Same as NumberOptions

## Id

**Usage Example**:

```typescript
// cat_id is a non-zero integer
let cat_id = id().parse(req.query.cat)
```

The id parser doesn't take additional options

## Boolean

It parse all truthy values as true, and falsy value as false with some exceptions to better support html form.

Example truthy value:

- "on"
- "true"
- non-empty string (after trim)
- non-zero numbers

Example falsy value:

- "false"
- 0
- NaN
- null
- undefined
- ""
- " "
- "\t"
- "\r"
- "\n"

**Example**:

```typescript
// is_admin is a boolean value
let is_admin = boolean().parse(user.is_admin)

// is_cancelled will be false if product.cancel_time is null
let is_cancelled = boolean().parse(product.cancel_time)

// effectively asserting the user is admin (throw InvalidInputError if user.is_admin is falsy)
boolean(true).parse(user.is_admin)
```

**Options of number parser**:

```typescript
function boolean(expectedValue?: boolean): Parser<boolean>
```

## Checkbox

When this parser is used as a field of object parser, it will treat absent fields as falsy because browsers will omit unchecked fields when submitting form.

**Example**:

```typescript
// is_admin is a boolean
let is_admin = checkbox().parse(req.body.is_admin)
```

The checkbox parser doesn't take additional options

## Color

**Example**:

```typescript
// primary_color is a string in "#rrggbb" format
let primary_color = color().parse(req.body.primary_color)
```

The color parser doesn't take additional options

## Object

**Example**:

```typescript
// newUser is an object of { username: string, email: string }
let newUser = object({
  username: string({ minLength: 3, maxLength: 32 }),
  email: email(),
}).parse(req.body)
```

**Options of object parser**:

```typescript
type ObjectOptions<T extends object> = {
  [P in keyof T]: Parser<T[P]>
}
```

## Date

**Example**:

```typescript
// sinceDate is a Date object indicating a timestamp in the past
let sinceDate = date({ max: Date.now() }).parse(req.query.sinceDate)

// untilDate is a Date object between sinceDate and current timestamp
let untilDate = date({
  max: Date.now(),
  min: sinceDate,
}).parse(req.query.untilDate)
```

**Options of date parser**:

```typescript
type DateOptions = {
  min?: number | Date | string
  max?: number | Date | string
}
```

## DateString

Convert from `string` | `Date` | `number` to `string` in the format of `yyyy-mm-dd`

**Example**:

```typescript
// sinceDate is date string indicating a date in the past
let sinceDate = dateString({ max: Date.now() }).parse(req.query.sinceDate)

// untilDate is a date string between sinceDate and current date
let untilDate = date({
  max: Date.now(),
  min: sinceDate,
}).parse(req.query.untilDate)
```

**Options of dateString parser**:

```typescript
type DateStringOptions = {
  nonEmpty?: boolean
  min?: number | Date | string
  max?: number | Date | string
}
```

# TimeString

Convert from `string` | `Date` | `number` to `string` in the format of `hh:mm`

**Example**:

```typescript
// sinceTime is time string indicating a time in the past (same date)
let sinceTime = timeString({ max: Date.now() }).parse(req.query.sinceTime)

// untilTime is a time string between sinceTime and current time
let untilTime = time({
  max: Date.now(),
  min: sinceTime,
}).parse(req.query.untilTime)
```

**Options of timeString parser**:

```typescript
type TimeStringOptions = {
  nonEmpty?: boolean
  min?: number | Date | string
  max?: number | Date | string
}
```

## Url

**Example**:

```typescript
// blogUrl is a string of hyperlink
let blogUrl = url({ protocols: ['https', 'http'] }).parse(req.body.blogUrl)
```

**Options of url parser**:

```typescript
type UrlOptions = StringOptions & {
  domain?: string
  protocol?: string
  protocols?: string[]
}
```

## Email

**Example**:

```typescript
// userEmail is a string of email address
let userEmail = email().parse(req.body.email)
```

**Options of url parser**:

```typescript
type EmailOptions = StringOptions & {
  domain?: string
}
```

## Literal

**Example**:

```typescript
// effectively asserting the role is 'guest' (throw InvalidInputError if it isn't)
let role = literal('guest').parse(req.session?.role)
```

**Options of literal parser**:

```typescript
function literal<T>(value: T): Parser<T>
```

## Values / Enums

**Example**:

```typescript
// color is like an enums value of 'red' | 'yellow' | 'green' | 'blue'
let color = values([
  'red' as const,
  'yellow' as const,
  'green' as const,
  'blue' as const,
]).parse(req.query.color)
```

**Options of values parser**:

```typescript
function values<T>(values: T[]): Parser<T>

// alias
let enums = values
```

The function `values()` is also aliased as `enums()`

## Array

**Example**:

```typescript
// categories is an array of string
let categories = array(string()).parse(req.body.categories)

// req.query is a string or array of string
// item_ids is an array of string
let item_ids = array(string(), { maybeSingle: true }).parse(req.query.item_id)
```

**Options of array parser**:

```typescript
type ArrayOptions = {
  minLength?: number
  maxLength?: number
  maybeSingle?: boolean // to handle variadic value (e.g. req.query.category)
}

function array<T>(
  parser: Parser<T>,
  options: ArrayOptions & CustomSampleOptions<T[]> = {},
): Parser<T[]>
```

## SingletonArray

**Example**:

```typescript
// fields.title is a single-element array of string
// title is a string
let title = singletonArray(string()).parse(fields.title)

// example parsing result from formidable v3+
let formInput = object({
  fields: object({
    title: singletonArray(string()),
  }),
  files: object({
    cover_image: singletonArray(object({ newFilename: string() })),
  }),
}).parse({ fields, files })
```

**Options of singletonArray parser**:

```typescript
function singletonArray<T>(valueParser: Parser<T>): Parser<T>
```

## Nullable

**Example**:

```typescript
// tag is a string or null value
let tag = nullable(string()).parse(req.body.tag)
```

**Options of nullable parser**:

```typescript
function nullable<T>(parser: Parser<T>): Parser<T | null>
```

## Optional

**Example**:

```typescript
/** searchQuery is an object of {
 *   page?: number
 *   count?: number
 *   category?: string
 *   keyword: string
 * }
 */
let searchQuery = object({
  page: optional(int({ min: 1 })),
  count: optional(int({ max: 25 })),
  category: optional(string()),
  keyword: string({ minLength: 3 }),
}).parse(req.query)
```

**Options of nullable parser**:

```typescript
function optional<T>(parser: Parser<T>): Parser<T | undefined>
```

## Or / Union

**Example**:

```typescript
// filter1.is_cancelled is `boolean | { $notNull: boolean } | { $null: boolean }`
let filter1 = object({
  is_cancelled: union([
    boolean(),
    object({ $notNull: boolean() }),
    object({ $null: boolean() }),
  ]),
}).parse(req.body)

// filter2.category is `false | Array<number>`
let filter2 = object({
  category: or([literal(false), array(id())]),
})
```

**Options of or/union parser**:

```typescript
function or<T>(
  parsers: Parser<T>[],
  options: CustomSampleOptions<T> = {},
): Parser<T>

// alias
let union = or
```

## Dict / Record

**Example**:

```typescript
const fieldNameParser = values(['create_time', 'update_time'])
const sortTypeParser = values(['asc', 'desc'])
const queryParser = object({
  sort: dict({ key: fieldNameParser, value: sortTypeParser }),
})
// query.sort is `Record<"create_time" | "update_time", "asc" | "desc">`
let query = queryParser.parse(req.body)
```

**Options of dict/record parser**:

```typescript
function dict<K extends PropertyKey, V>(
  options: {
    key?: Parser<K>
    value: Parser<V>
  } & CustomSampleOptions<Record<K, V>>,
): Parser<Record<K, V>>

// alias
let record = dict
```

## Acknowledgments

The API design is inspired by [Zod](https://github.com/colinhacks/zod). The main difference is cast.ts auto convert data between different types with it's valid, e.g. it converts numeric value from string if it's valid, which is useful when parsing data from `req.query`.

The icon of cast.ts is generated with [diffuse-the-rest](https://huggingface.co/spaces/huggingface/diffuse-the-rest) and up-scaled by [Real-ESRGAN](https://huggingface.co/spaces/ali-ghamdan/realesrgan-models), then it is post-processed with [GIMP](https://www.gimp.org).

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others
