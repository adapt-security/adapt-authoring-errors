/**
 * A generic error class for use in Adapt applications
 */
 export default class AdaptError extends Error {
  /**
   * @constructor
   * @param {string} code The error code
   * @param {number} statusCode The HTTP status code
   * @param {string} description A description for the error
   */
  constructor(code, statusCode = 500, description = '') {
    super(code);
    this.code = code;
    this.statusCode = statusCode;
    this.description = description;
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
  /**
   * Chainable function to allow setting of HTTP status code
   * @param {number} statusCode 
   * @returns {AdaptError}
   */
  setStatusCode(statusCode) {
    this.statusCode = statusCode;
    return this;
  }
}
