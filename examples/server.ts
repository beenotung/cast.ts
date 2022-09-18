import { ParseResult, object, string, int, optional, array, id } from 'cast.ts'
import express from 'express'
import { print } from 'listening-on'

let app = express()
let port = 8100
app.listen(port, () => {
  print(port)
})

let searchQuery = object({
  page: optional(int({ min: 1 })),
  count: optional(int({ max: 25 })),
  cat: optional(array(id(), { maybeSingle: true })),
  keyword: string({ minLength: 3 }),
})
type SearchQuery = ParseResult<typeof searchQuery>
// The inferred type is {
//   page: number | undefined
//   count: number | undefined
//   cat: number[] | undefined
//   keyword: string
// }

// Example: http://localhost:8100/product/search?page=2&count=20&keyword=food&cat=12&cat=18
app.get('/product/search', async (req, res) => {
  let query: SearchQuery
  try {
    console.log(req.method, req.url, req.query)
    query = searchQuery.parse(req.query)
    console.log('parsed query:', query)
  } catch (error) {
    return res.status(400).json({ error: String(error) })
  }
  try {
    let count: number = query.count || 25
    let page: number = query.page || 1
    let offset: number = (page - 1) * count
    let matches: object[] = await produceService.search({
      offset,
      limit: count,
      keyword: query.keyword,
      cat_ids: query.cat,
    })
    return res.json({ matches })
  } catch (error) {
    return res.status(500).json({ error: String(error) })
  }
})

class ProductService {
  search(query: {
    offset: number
    limit: number
    keyword: string
    cat_ids?: number[]
  }): Promise<Array<{ id: number; name: string }>> {
    console.log('productService.search():', query)
    throw new Error('mock implementation')
  }
}

let produceService = new ProductService()
