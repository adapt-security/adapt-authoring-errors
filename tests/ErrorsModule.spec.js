import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import AdaptError from '../lib/AdaptError.js'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Note: ErrorsModule depends on adapt-authoring-core which is not available,
// so we test the core logic that can be tested independently
describe('ErrorsModule', () => {
  let tempDir

  beforeEach(() => {
    // Create a temporary directory for test errors
    tempDir = join(__dirname, 'temp-test-errors')
    mkdirSync(tempDir, { recursive: true })
    mkdirSync(join(tempDir, 'errors'), { recursive: true })
  })

  afterEach(() => {
    // Cleanup temp directory
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('Error definition structure', () => {
    it('should validate error definition format', () => {
      const errorDef = {
        description: 'Test error description',
        statusCode: 404,
        data: {
          id: 'Item identifier'
        }
      }

      assert.ok(errorDef.description)
      assert.equal(typeof errorDef.description, 'string')
      assert.ok(errorDef.statusCode)
      assert.equal(typeof errorDef.statusCode, 'number')
      if (errorDef.data) {
        assert.equal(typeof errorDef.data, 'object')
      }
    })

    it('should create AdaptError from definition', () => {
      const errorDef = {
        description: 'Test error',
        statusCode: 500,
        data: {
          field: 'Test field'
        }
      }

      const metadata = { description: errorDef.description }
      if (errorDef.data) {
        metadata.data = errorDef.data
      }

      const error = new AdaptError('TEST_CODE', errorDef.statusCode, metadata)

      assert.ok(error instanceof AdaptError)
      assert.equal(error.code, 'TEST_CODE')
      assert.equal(error.statusCode, 500)
      assert.equal(error.meta.description, 'Test error')
      assert.deepEqual(error.meta.data, { field: 'Test field' })
    })

    it('should handle error definition without data field', () => {
      const errorDef = {
        description: 'Simple error',
        statusCode: 400
      }

      const metadata = { description: errorDef.description }
      const error = new AdaptError('SIMPLE_ERROR', errorDef.statusCode, metadata)

      assert.ok(error.meta.description)
      assert.equal(error.meta.data, undefined)
    })
  })

  describe('Error JSON file format', () => {
    it('should parse valid error JSON file', () => {
      const errorDefs = {
        ERROR_ONE: {
          description: 'First error',
          statusCode: 400
        },
        ERROR_TWO: {
          description: 'Second error',
          statusCode: 404,
          data: {
            id: 'Identifier'
          }
        }
      }

      writeFileSync(
        join(tempDir, 'errors', 'test.json'),
        JSON.stringify(errorDefs)
      )

      const content = JSON.parse(
        readFileSync(join(tempDir, 'errors', 'test.json'), 'utf8')
      )

      assert.ok(content.ERROR_ONE)
      assert.ok(content.ERROR_TWO)
      assert.equal(content.ERROR_ONE.statusCode, 400)
      assert.equal(content.ERROR_TWO.statusCode, 404)
    })

    it('should validate error codes are uppercase with underscores', () => {
      const validCodes = ['TEST_ERROR', 'NOT_FOUND', 'SERVER_ERROR', 'MY_CUSTOM_ERROR']

      validCodes.forEach(code => {
        assert.ok(/^[A-Z_]+$/.test(code), `${code} should be uppercase with underscores`)
      })
    })

    it('should handle multiple error JSON files', () => {
      writeFileSync(
        join(tempDir, 'errors', 'set-a.json'),
        JSON.stringify({ ERR_A: { description: 'Error A', statusCode: 400 } })
      )
      writeFileSync(
        join(tempDir, 'errors', 'set-b.json'),
        JSON.stringify({ ERR_B: { description: 'Error B', statusCode: 404 } })
      )

      const contentA = JSON.parse(
        readFileSync(join(tempDir, 'errors', 'set-a.json'), 'utf8')
      )
      const contentB = JSON.parse(
        readFileSync(join(tempDir, 'errors', 'set-b.json'), 'utf8')
      )

      const merged = { ...contentA, ...contentB }
      assert.ok(merged.ERR_A)
      assert.ok(merged.ERR_B)
      assert.equal(Object.keys(merged).length, 2)
    })
  })

  describe('Error definition examples', () => {
    it('should demonstrate typical error patterns', () => {
      const errorPatterns = [
        { code: 'NOT_FOUND', statusCode: 404, description: 'Resource not found' },
        { code: 'UNAUTHORIZED', statusCode: 401, description: 'Authentication required' },
        { code: 'FORBIDDEN', statusCode: 403, description: 'Access denied' },
        { code: 'BAD_REQUEST', statusCode: 400, description: 'Invalid request' },
        { code: 'SERVER_ERROR', statusCode: 500, description: 'Internal server error' }
      ]

      errorPatterns.forEach(pattern => {
        const error = new AdaptError(pattern.code, pattern.statusCode, { description: pattern.description })
        assert.equal(error.code, pattern.code)
        assert.equal(error.statusCode, pattern.statusCode)
        assert.equal(error.meta.description, pattern.description)
      })
    })
  })

  describe('Error sorting', () => {
    it('should sort error codes alphabetically', () => {
      const unsortedCodes = ['ZEBRA_ERROR', 'ALPHA_ERROR', 'MIDDLE_ERROR', 'BETA_ERROR']
      const sortedCodes = [...unsortedCodes].sort()

      assert.deepEqual(sortedCodes, ['ALPHA_ERROR', 'BETA_ERROR', 'MIDDLE_ERROR', 'ZEBRA_ERROR'])
    })
  })

  describe('Error metadata handling', () => {
    it('should preserve description in metadata', () => {
      const description = 'A detailed error description'
      const metadata = { description }
      const error = new AdaptError('TEST', 500, metadata)

      assert.equal(error.meta.description, description)
    })

    it('should preserve data schema in metadata', () => {
      const data = {
        userId: 'User identifier',
        action: 'The action being performed'
      }
      const metadata = { description: 'Test', data }
      const error = new AdaptError('TEST', 500, metadata)

      assert.deepEqual(error.meta.data, data)
    })
  })

  describe('loadErrors reduction logic', () => {
    it('should create getter properties that return AdaptError instances', () => {
      const errorDefs = {
        TEST_ERR: { description: 'A test', statusCode: 500 }
      }

      const result = Object.entries(errorDefs)
        .sort()
        .reduce((m, [k, { description, statusCode, data }]) => {
          return Object.defineProperty(m, k, {
            get: () => {
              const metadata = { description }
              if (data) metadata.data = data
              return new AdaptError(k, statusCode, metadata)
            },
            enumerable: true
          })
        }, {})

      const error = result.TEST_ERR
      assert.ok(error instanceof AdaptError)
      assert.equal(error.code, 'TEST_ERR')
      assert.equal(error.statusCode, 500)
      assert.equal(error.meta.description, 'A test')
    })

    it('should return a new instance on each property access', () => {
      const errorDefs = {
        MY_ERROR: { description: 'Repeated', statusCode: 400 }
      }

      const result = Object.entries(errorDefs)
        .sort()
        .reduce((m, [k, { description, statusCode, data }]) => {
          return Object.defineProperty(m, k, {
            get: () => {
              const metadata = { description }
              if (data) metadata.data = data
              return new AdaptError(k, statusCode, metadata)
            },
            enumerable: true
          })
        }, {})

      const first = result.MY_ERROR
      const second = result.MY_ERROR
      assert.notEqual(first, second)
      assert.equal(first.code, second.code)
    })

    it('should include data in metadata when defined', () => {
      const errorDefs = {
        DATA_ERR: { description: 'Has data', statusCode: 404, data: { id: 'Item ID' } }
      }

      const result = Object.entries(errorDefs)
        .sort()
        .reduce((m, [k, { description, statusCode, data }]) => {
          return Object.defineProperty(m, k, {
            get: () => {
              const metadata = { description }
              if (data) metadata.data = data
              return new AdaptError(k, statusCode, metadata)
            },
            enumerable: true
          })
        }, {})

      const error = result.DATA_ERR
      assert.deepEqual(error.meta.data, { id: 'Item ID' })
    })

    it('should omit data from metadata when not defined', () => {
      const errorDefs = {
        NO_DATA_ERR: { description: 'No data', statusCode: 500 }
      }

      const result = Object.entries(errorDefs)
        .sort()
        .reduce((m, [k, { description, statusCode, data }]) => {
          return Object.defineProperty(m, k, {
            get: () => {
              const metadata = { description }
              if (data) metadata.data = data
              return new AdaptError(k, statusCode, metadata)
            },
            enumerable: true
          })
        }, {})

      const error = result.NO_DATA_ERR
      assert.equal(error.meta.data, undefined)
      assert.ok(!('data' in error.meta))
    })

    it('should sort error codes alphabetically in reduced result', () => {
      const errorDefs = {
        ZEBRA: { description: 'Z', statusCode: 500 },
        ALPHA: { description: 'A', statusCode: 500 },
        MIDDLE: { description: 'M', statusCode: 500 }
      }

      const result = Object.entries(errorDefs)
        .sort()
        .reduce((m, [k, { description, statusCode, data }]) => {
          return Object.defineProperty(m, k, {
            get: () => {
              const metadata = { description }
              if (data) metadata.data = data
              return new AdaptError(k, statusCode, metadata)
            },
            enumerable: true
          })
        }, {})

      const keys = Object.keys(result)
      assert.deepEqual(keys, ['ALPHA', 'MIDDLE', 'ZEBRA'])
    })

    it('should make error properties enumerable', () => {
      const errorDefs = {
        ENUM_ERR: { description: 'Enumerable', statusCode: 500 }
      }

      const result = Object.entries(errorDefs)
        .sort()
        .reduce((m, [k, { description, statusCode, data }]) => {
          return Object.defineProperty(m, k, {
            get: () => {
              const metadata = { description }
              if (data) metadata.data = data
              return new AdaptError(k, statusCode, metadata)
            },
            enumerable: true
          })
        }, {})

      const descriptor = Object.getOwnPropertyDescriptor(result, 'ENUM_ERR')
      assert.equal(descriptor.enumerable, true)
      assert.equal(typeof descriptor.get, 'function')
    })
  })

  describe('Shipped error definitions', () => {
    it('should have valid node-core error definitions', () => {
      const nodeCoreErrors = JSON.parse(
        readFileSync(join(__dirname, '..', 'errors', 'node-core.json'), 'utf8')
      )

      const expectedCodes = ['EACCES', 'EADDRINUSE', 'ECONNREFUSED', 'EEXIST', 'ENOENT', 'ENOTEMPTY', 'MODULE_NOT_FOUND']
      expectedCodes.forEach(code => {
        assert.ok(nodeCoreErrors[code], `Missing expected error code: ${code}`)
        assert.equal(typeof nodeCoreErrors[code].description, 'string')
        assert.equal(typeof nodeCoreErrors[code].statusCode, 'number')
      })
    })

    it('should have valid adapt error definitions', () => {
      const adaptErrors = JSON.parse(
        readFileSync(join(__dirname, '..', 'errors', 'adapt-errors.json'), 'utf8')
      )

      const expectedCodes = ['FUNC_NOT_OVERRIDDEN', 'FUNC_DISABLED', 'SERVER_ERROR', 'INVALID_PARAMS', 'NOT_FOUND']
      expectedCodes.forEach(code => {
        assert.ok(adaptErrors[code], `Missing expected error code: ${code}`)
        assert.equal(typeof adaptErrors[code].description, 'string')
        assert.equal(typeof adaptErrors[code].statusCode, 'number')
      })
    })

    it('should have valid test error definitions', () => {
      const testErrors = JSON.parse(
        readFileSync(join(__dirname, 'data', 'test-errors.json'), 'utf8')
      )

      assert.ok(testErrors.TEST_ERROR)
      assert.ok(testErrors.TEST_NOT_FOUND)
      assert.ok(testErrors.TEST_VALIDATION_ERROR)
      assert.equal(testErrors.TEST_NOT_FOUND.statusCode, 404)
      assert.equal(testErrors.TEST_VALIDATION_ERROR.statusCode, 400)
    })

    it('should use uppercase with underscores for all error codes', () => {
      const files = ['node-core.json', 'adapt-errors.json']
      files.forEach(file => {
        const errors = JSON.parse(
          readFileSync(join(__dirname, '..', 'errors', file), 'utf8')
        )
        Object.keys(errors).forEach(code => {
          assert.ok(/^[A-Z][A-Z0-9_]*$/.test(code), `Invalid error code format: ${code} in ${file}`)
        })
      })
    })
  })

  describe('Duplicate error detection', () => {
    it('should detect duplicate error codes across files', () => {
      writeFileSync(
        join(tempDir, 'errors', 'first.json'),
        JSON.stringify({ DUPLICATE: { description: 'First', statusCode: 500 } })
      )
      writeFileSync(
        join(tempDir, 'errors', 'second.json'),
        JSON.stringify({ DUPLICATE: { description: 'Second', statusCode: 400 } })
      )

      const allDefs = {}
      const duplicates = []

      const files = ['first.json', 'second.json']
      files.forEach(file => {
        const contents = JSON.parse(
          readFileSync(join(tempDir, 'errors', file), 'utf8')
        )
        Object.entries(contents).forEach(([k, v]) => {
          if (allDefs[k]) {
            duplicates.push(k)
          } else {
            allDefs[k] = v
          }
        })
      })

      assert.equal(duplicates.length, 1)
      assert.equal(duplicates[0], 'DUPLICATE')
    })
  })
})
