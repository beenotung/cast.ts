import {
  object,
  string,
  int,
  optional,
  array,
  id,
  email,
  url,
  values,
  nullable,
  or,
  literal,
  inferFromSampleValue,
} from '../src/core'

function show(name: string, parser: { schema: unknown }) {
  console.log(`--- ${name} ---`)
  console.log(JSON.stringify(parser.schema, null, 2))
  console.log()
}

console.log('=== cast.ts JSON Schema Output ===\n')

show(
  'searchQuery',
  object({
    page: optional(int({ min: 1 })),
    count: optional(int({ max: 25 })),
    cat: optional(array(id(), { maybeSingle: true })),
    keyword: string({ minLength: 3 }),
  }),
)

show(
  'userProfile',
  object({
    username: string({ nonEmpty: true }),
    email: email(),
    role: values(['admin', 'user']),
    avatar: optional(nullable(url())),
  }),
)

show(
  'postList (inferFromSampleValue)',
  inferFromSampleValue({
    postList: [
      {
        id: 1,
        title: 'Hello World',
        type$enums: ['public', 'vip'],
        hidden$optional: true,
      },
    ],
  }),
)

show(
  'union type',
  or([literal('guest'), object({ id: id(), name: string() })]),
)
