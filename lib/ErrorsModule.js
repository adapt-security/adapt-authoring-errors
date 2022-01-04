import { AbstractModule } from 'adapt-authoring-core';
import fs from 'fs/promises';
import globCallback from 'glob';
import { promisify } from 'util';

/** @ignore */ const globPromise = promisify(globCallback);

export default class ErrorHandlingModule extends AbstractModule {
  /** @override */
  async init() {
    this.app.errors = this;
    this.codes = await this.loadErrors();
  }
  async loadErrors() {
    const errors = {};
    await Promise.all(Object.values(this.app.dependencies).map(async d => {
      const files = await globPromise(`errors/*.json`, { cwd: d.rootDir, realpath: true });
      await Promise.all(files.map(async f => {
        try {
          const contents = JSON.parse(await fs.readFile(f));
          Object.entries(contents).forEach(([k,v]) => {
            if(errors[k]) return this.log('warn', `error code '${k}' already defined`);
            errors[k] = v;
          });
        } catch(e) {
          this.log('error', e.message);
        }
      }));
      return errors;
    }));
    return errors;
  }
}
