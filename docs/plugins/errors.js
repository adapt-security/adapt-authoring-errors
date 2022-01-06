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
      const { code, description, statusCode } = this.app.errors[k];
      return `${md}\n| ${code} | ${description} | ${statusCode} |`;
    }, '| Error code | Description | HTTP status code |\n| - | - | :-: |');
  }
  async writeFile(content) {
    const input = fs.readFileSync(new URL('errorsref.md', import.meta.url)).toString();
    const outputPath = `${this.outputDir}/errorsref.md`;
    fs.writeFileSync(outputPath, input.replace('{{{ERRORS}}}', content));
    this.customFiles = [outputPath];
  }
}