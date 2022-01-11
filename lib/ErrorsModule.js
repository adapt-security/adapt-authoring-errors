import { AbstractModule } from 'adapt-authoring-core';
import AdaptError from './AdaptError.js';
import fs from 'fs/promises';
import globCallback from 'glob';
import { promisify } from 'util';

/** @ignore */ const globPromise = promisify(globCallback);

class ErrorHandlingModule extends AbstractModule {
  /** @override */
  async init() {
    this.app.errors = this.errors = await this.loadErrors();
  }
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
            return new AdaptError(code, statusCode, metadata);
          }, 
          enumerable: true 
        });
      }, {});
  }
}

export default ErrorHandlingModule;