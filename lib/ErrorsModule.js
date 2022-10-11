import { AbstractModule } from 'adapt-authoring-core';
import AdaptError from './AdaptError.js';
import fs from 'fs/promises';
import globCallback from 'glob';
import { promisify } from 'util';

/** @ignore */ const globPromise = promisify(globCallback);

/**
 * Module to store a global reference to all errors defined in the system. Errors are accessed from here and thrown appropriately elsewhere.
 */
class ErrorHandlingModule extends AbstractModule {
  /** @override */
  async init() {
    /**
     * A key/value store of all errors defined in the system. Errors are accessed via the human-readable error code for better readability when thrown in code.
     * @type {object}
     * @see {AdaptError}
     */
    this.errors = await this.loadErrors();
    this.app.errors = this.errors;
  }
  /**
   * Loads all errors defined in Adapt module dependencies
   * @returns {Promise}
   */
  async loadErrors() {
    const errorDefs = {};
    await Promise.all(Object.values(this.app.dependencies).map(async d => {
      const files = await globPromise(`errors/*.json`, { cwd: d.rootDir, realpath: true });
      await Promise.all(files.map(async f => {
        try {
          const contents = JSON.parse(await fs.readFile(f));
          Object.entries(contents).forEach(([k,v]) => {
            if(errorDefs[k]) return this.log('warn', `error code '${k}' already defined`);
            errorDefs[k] = v;
          });
        } catch(e) {
          this.log('error', e.message);
        }
      }));
    }));
    return Object.entries(errorDefs)
      .sort()
      .reduce((m,[k, { description, statusCode, data }]) => {
        return Object.defineProperty(m, k, { 
          get: () => {
            const metadata = { description };
            if(data) metadata.data = data;
            return new AdaptError(k, statusCode, metadata);
          }, 
          enumerable: true 
        });
      }, {});
  }
}

export default ErrorHandlingModule;