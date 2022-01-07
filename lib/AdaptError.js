/**
 * A generic error class for use in Adapt applications
 */
 class AdaptError extends Error {
  /**
   * @constructor
   * @param {string} code The error code
   * @param {number} statusCode The HTTP status code
   * @param {string} description A description for the error
   * @param {object} data Supplenetal data related to the error
   */
  constructor(code, statusCode = 500, description = '', data = {}) {
    super(code);
    this.code = code;
    this.statusCode = statusCode;
    this.description = description;
    this.data = data;
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

export default AdaptError;