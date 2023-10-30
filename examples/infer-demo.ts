import { ParseResult, inferFromSampleValue } from 'cast.ts'

let samplePostListResult = {
  postList: [
    {
      id: 1,
      title: 'Hello world',
      status$enums: ['active' as const, 'hidden' as const],
      author: {
        id: 1,
        username: 'alice',
      },
      comments: [
        {
          id: 1,
          user: {
            id: 1,
            username: 'alice',
          },
          content: 'sample comment',
        },
      ],
    },
  ],
}

let parser = inferFromSampleValue(samplePostListResult)
console.log(parser.type)

type Result = ParseResult<typeof parser>
type Post = Result['postList'][number]
type PostStatus = Post['status']

function checkType<T>(t: T) {
  /* noop */
}

checkType<'active' | 'hidden'>(null as unknown as PostStatus)
