import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import AdaptError from '../lib/AdaptError.js'

describe('AdaptError', () => {
  describe('constructor', () => {
    it('should create an error with code only', () => {
      const error = new AdaptError('TEST_ERROR')
      assert.equal(error.code, 'TEST_ERROR')
      assert.equal(error.statusCode, 500)
      assert.deepEqual(error.meta, {})
      assert.ok(error instanceof Error)
      assert.ok(error instanceof AdaptError)
    })

    it('should create an error with code and statusCode', () => {
      const error = new AdaptError('NOT_FOUND', 404)
      assert.equal(error.code, 'NOT_FOUND')
      assert.equal(error.statusCode, 404)
      assert.deepEqual(error.meta, {})
    })

    it('should create an error with code, statusCode, and metadata', () => {
      const metadata = { description: 'Test error', data: { id: '123' } }
      const error = new AdaptError('CUSTOM_ERROR', 400, metadata)
      assert.equal(error.code, 'CUSTOM_ERROR')
      assert.equal(error.statusCode, 400)
      assert.deepEqual(error.meta, metadata)
    })

    it('should use default statusCode of 500 when not provided', () => {
      const error = new AdaptError('SERVER_ERROR')
      assert.equal(error.statusCode, 500)
    })

    it('should use empty object as default metadata when not provided', () => {
      const error = new AdaptError('TEST_ERROR', 400)
      assert.deepEqual(error.meta, {})
    })

    it('should set the message property to the error code', () => {
      const error = new AdaptError('MY_ERROR')
      assert.equal(error.message, 'MY_ERROR')
    })
  })

  describe('#setData()', () => {
    it('should set data on the error', () => {
      const error = new AdaptError('TEST_ERROR')
      const data = { userId: '123', action: 'delete' }
      error.setData(data)
      assert.deepEqual(error.data, data)
    })

    it('should return the error instance for chaining', () => {
      const error = new AdaptError('TEST_ERROR')
      const returnValue = error.setData({ test: 'value' })
      assert.equal(returnValue, error)
    })

    it('should allow method chaining', () => {
      const error = new AdaptError('TEST_ERROR')
      const data = { key: 'value' }
      const result = error.setData(data)
      assert.equal(result.data, data)
      assert.ok(result instanceof AdaptError)
    })

    it('should overwrite existing data', () => {
      const error = new AdaptError('TEST_ERROR')
      error.setData({ first: 'data' })
      error.setData({ second: 'data' })
      assert.deepEqual(error.data, { second: 'data' })
    })
  })

  describe('#toString()', () => {
    it('should return formatted string without data', () => {
      const error = new AdaptError('TEST_ERROR')
      const result = error.toString()
      // Note: trailing space after code is part of the current implementation
      assert.equal(result, 'AdaptError: TEST_ERROR ')
    })

    it('should return formatted string with data', () => {
      const error = new AdaptError('TEST_ERROR')
      error.setData({ userId: '123' })
      const result = error.toString()
      assert.equal(result, 'AdaptError: TEST_ERROR {"userId":"123"}')
    })

    it('should include class name in output', () => {
      const error = new AdaptError('MY_ERROR')
      const result = error.toString()
      assert.ok(result.startsWith('AdaptError:'))
    })

    it('should handle complex data objects', () => {
      const error = new AdaptError('COMPLEX_ERROR')
      const complexData = { nested: { key: 'value' }, array: [1, 2, 3] }
      error.setData(complexData)
      const result = error.toString()
      assert.ok(result.includes(JSON.stringify(complexData)))
    })
  })

  describe('Error properties', () => {
    it('should have code property', () => {
      const error = new AdaptError('TEST_CODE')
      assert.equal(typeof error.code, 'string')
      assert.equal(error.code, 'TEST_CODE')
    })

    it('should have statusCode property', () => {
      const error = new AdaptError('TEST_ERROR', 404)
      assert.equal(typeof error.statusCode, 'number')
      assert.equal(error.statusCode, 404)
    })

    it('should have meta property', () => {
      const meta = { description: 'Test' }
      const error = new AdaptError('TEST_ERROR', 500, meta)
      assert.equal(typeof error.meta, 'object')
      assert.deepEqual(error.meta, meta)
    })

    it('should have data property after setData is called', () => {
      const error = new AdaptError('TEST_ERROR')
      error.setData({ test: 'data' })
      assert.equal(typeof error.data, 'object')
      assert.deepEqual(error.data, { test: 'data' })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string as error code', () => {
      const error = new AdaptError('')
      assert.equal(error.code, '')
      assert.equal(error.message, '')
    })

    it('should handle null metadata', () => {
      const error = new AdaptError('TEST_ERROR', 500, null)
      assert.equal(error.meta, null)
    })

    it('should handle zero statusCode', () => {
      const error = new AdaptError('TEST_ERROR', 0)
      assert.equal(error.statusCode, 0)
    })

    it('should handle setData with null', () => {
      const error = new AdaptError('TEST_ERROR')
      error.setData(null)
      assert.equal(error.data, null)
    })

    it('should handle setData with undefined', () => {
      const error = new AdaptError('TEST_ERROR')
      error.setData(undefined)
      assert.equal(error.data, undefined)
    })
  })
})
