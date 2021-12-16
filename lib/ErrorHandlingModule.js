import { AbstractModule } from 'adapt-authoring-core';

export default class ErrorHandlingModule extends AbstractModule {
  /** @override */
  async init() {
    this.app.error = this;
    this.errors = await this.loadErrors();
  }
  async loadErrors() {
    return Promise.all(Object.values(this.app.dependencies).map(async d => {
      const files = await globPromise(`errors/*.json`, { cwd: dir, realpath: true });
      const errors = {};
      await Promise.all(files.map(async f => {
        const namespace = path.basename(f).replace('.json', '');
        try {
          const contents = JSON.parse((await fs.readFile(f)).toString());
          Object.entries(contents).forEach(([k,v]) => errors[`${namespace}.${k}`] = v);
        } catch(e) {
          this.log('error', f);
        }
      }));
      return errors;
    }));
  }
}
