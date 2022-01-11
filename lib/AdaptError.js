/**
 * A generic error class for use in Adapt applications
 */
 class AdaptError extends Error {
  /**
   * @constructor
   * @param {string} code The error code
   * @param {number} statusCode The HTTP status code
   * @param {object} metadata Metadata describing the error
   */
  constructor(code, statusCode = 500, metadata = {}) {
    super(code);
    /**
     * The error code
     * @type {String}
     */
    this.code = code;
    /**
     * The HTTP status code
     * @type {String}
     */
    this.statusCode = statusCode;
    /**
     * Metadata describing the error
     * @type {Object}
     */
    this.meta = metadata;
  }
  /**
   * Chainable function to allow setting of data
   * @param {*} data
   * @returns {AdaptError}
   */
  setData(data) {
    this.data = data;
    return this;
  }
}

export default AdaptError;