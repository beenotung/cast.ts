import Ajv from 'ajv'
import addFormats from 'ajv-formats'

let ajv = new Ajv({ strict: true, allErrors: true })
addFormats(ajv)

let schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
}

let data = {
  name: 'John',
  age: 30,
}

let validate = ajv.compile(schema)

let result = validate(data)
console.log({ result })
