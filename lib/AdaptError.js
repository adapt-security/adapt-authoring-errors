/**
 * A generic error class for use in Adapt applications
 */
 export default class AdaptError extends Error {
  /**
   * @constructor
   * @param {String} code The error code
   * @param {String} statusCode The HTTP status code
   */
  constructor(code, statusCode = 500) {
    super(code);
    this.code = code;
    this.statusCode = statusCode;
  }
  /**
   * Chainable function to allow setting of data
   * @param {*} data
   * @returns {AdaptError}
   */
  data(data) {
    this.data = data;
    return this;
  }
  /**
   * Chainable function to allow setting of HTTP status code
   * @param {number} statusCode 
   * @returns {AdaptError}
   */
  statusCode(statusCode) {
    this.statusCode = statusCode;
    return this;
  }
}
