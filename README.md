# cast.ts

An expressive data validation library with explicit data type conversion.

cast.ts makes it easy to validate data from RESTful API.

[![npm Package Version](https://img.shields.io/npm/v/cast.ts)](https://www.npmjs.com/package/cast.ts)

## Installation

```bash
npm install cast.ts
```

You can also install cast.ts with `pnpm`, `yarn`, or `slnpm`

## Usage Example

```typescript
import { object, string } from 'cast.ts'

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

For more complete example, see [examples/server.ts](./examples/server.ts)

## Supported Parsers

- primary parsers
  - string
  - number
  - int
  - float (alias of `number()`)
  - id (alias of `int({ min: 1 })`)
  - boolean
  - object
  - date
  - url
  - email
  - literal
  - enum
- decorator (wrapping primary parsers)
  - array
  - nullable
  - optional (for object fields)

### General Type

**Utility type**:

```typescript
// to extract inferred type of parsed payload
type ParseResult<T extends Parser<R>, R = unknown> = ReturnType<T['parse']>
```

**Reference types**:

```typescript
type Parser<T> = {
  parse(input: unknown, context?: ParserContext): T
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
