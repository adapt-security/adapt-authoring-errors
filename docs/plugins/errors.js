const fs = require('fs');
const path = require('path');

class Errors {
  constructor(app, config, outputDir) {
    this.app = app;
    this.outputDir = outputDir;
  }
  async run() {
    this.writeFile({});
  }
  async writeFile(content) {
    const input = fs.readFileSync(path.join(__dirname, 'errorsref.md')).toString();
    const outputPath = `${this.outputDir}/errorsref.md`;
    fs.writeFileSync(outputPath, input.replace('{{{ERRORS}}}', content));
    this.customFiles = [outputPath];
  }
}

module.exports = Errors;