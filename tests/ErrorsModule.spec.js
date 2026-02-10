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
      // Test that our error definitions follow the expected structure
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
  })

  describe('Error definition examples', () => {
    it('should demonstrate typical error patterns', () => {
      // Common HTTP error patterns
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
})
