import fs from 'fs';

export default class Errors {
  constructor(app, config, outputDir) {
    this.app = app;
    this.outputDir = outputDir;
  }
  async run() {
    const content = this.generateMd();
    this.writeFile(content);
  }
  generateMd() {
    return Object.keys(this.app.errors).reduce((md, k) => {
      const e = this.app.errors[k];
      return `${md}\n| \`${e.code}\` | ${e.meta.description} | ${e.statusCode} | <ul>${this.dataToMd(e.meta.data)}</ul> |`;
    }, '| Error code | Description | HTTP status code | Supplemental data |\n| - | - | :-: | - |');
  }
  dataToMd(data, s = '') {
    if(!data) return s;
    return Object.entries(data).reduce((s, [k, v]) => {
      return `${s}<li>\`${k}\`: ${typeof v === 'object' ? this.dataToMd(v, s) : v}</li>`;
    }, s);
  }
  async writeFile(content) {
    const input = fs.readFileSync(new URL('errorsref.md', import.meta.url)).toString();
    const outputPath = `${this.outputDir}/errorsref.md`;
    fs.writeFileSync(outputPath, input.replace('{{{ERRORS}}}', content));
    this.customFiles = [outputPath];
  }
}