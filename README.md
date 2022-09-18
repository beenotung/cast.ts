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
