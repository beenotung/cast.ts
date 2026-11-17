import { inferFromSampleValue } from 'cast.ts'

let sample = {
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  friends: [
    { id: 2, username: 'bob', email: 'bob@example.com' },
    { id: 3, username: 'charlie', email: 'charlie@example.com' },
  ],
  is_admin: false,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  profile_url: 'https://example.com/alice',
}
let parser = inferFromSampleValue(sample)
console.log(parser.type)
console.log(JSON.stringify(parser.jsonSchema, null, 2))
