/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';
const ProjectGenerator = require('../../lib/project-generator');
const utils = require('../../lib/utils');
const g = require('../../lib/globalize');
const path = require('path');

module.exports = class AppGenerator extends ProjectGenerator {
  // Note: arguments and options should be defined in the constructor.
  constructor(args, opts) {
    super(args, opts);
    this.buildOptions.push({
      name: 'docker',
      description: g.f('include Dockerfile and .dockerignore'),
    });
  }

  _setupGenerator() {
    this.projectType = 'application';

    this.option('applicationModuleName', {
      type: String,
      description: g.f('Application module name'),
    });

    this.option('docker', {
      type: Boolean,
      description: g.f('Include Dockerfile and .dockerignore (TO IMPLEMENT)'),
    });

    return super._setupGenerator();
  }

  async setOptions() {
    await super.setOptions();
    if (this.shouldExit()) return;
    if (this.options.applicationModuleName) {
      const clsName = utils.toClassName(this.options.applicationModuleName);
      if (typeof clsName === 'string') {
        this.projectInfo.applicationModuleName = clsName;
      } else if (clsName instanceof Error) {
        throw clsName;
      }
      const msg = utils.validateClassName(clsName);
      if (msg !== true) {
        throw new Error(msg);
      }
    }
  }

  promptProjectName() {
    if (this.shouldExit()) return;
    return super.promptProjectName();
  }

  promptProjectDir() {
    if (this.shouldExit()) return;
    return super.promptProjectDir();
  }

  async getAppConfig() {
    await super.getAppConfig(this.projectInfo.outdir);
  }

  async promptAppPort() {
    if (this.shouldExit()) return false;
    const prompts = [
      {
        type: 'input',
        name: 'projectPort',
        message: g.f('Project port:'),
        when: this.projectInfo.port == null,
        default: 9000,
      },
    ];

    return this.prompt(prompts).then(props => {
      Object.assign(this.projectInfo, props);
    });
  }

  promptOptions() {
    if (this.shouldExit()) return;
    return super.promptOptions();
  }

  scaffold() {
    const result = super.scaffold();
    if (this.shouldExit()) return result;

    const {docker} = this.projectInfo || {};
    if (!docker) {
      this.fs.delete(this.destinationPath('Dockerfile'));
      this.fs.delete(this.destinationPath('.dockerignore'));
    }

    return result;
  }

  async end() {
    await super.end();
    if (this.shouldExit()) return;
    this.log();
    this.log(g.f('Application %s was created in %s.', this.projectInfo.name, this.projectInfo.outdir));
    this.log();
    this.log(g.f('Next steps:'));
    this.log();
    this.log('$ cd ' + this.projectInfo.outdir);
    this.log(`$ go mod tidy && go mod vendor`);
    this.log(`$ vim config.yml to update database connection`);
    this.log(`$ ./bash/swagger.sh`);
    this.log(`$ ./bash/wire.sh`);
    this.log(`$ ./bash/redocly.sh`);
    this.log(`$ air`);
    this.log();
    this.log(`$ go run cmd/seeder/main.go`);
    this.log(`$ Ping: http://localhost:${this.projectInfo.projectPort}/ping`);
    this.log(`$ Swagger: http://localhost:${this.projectInfo.projectPort}/ba/swagger/index.html`);
    this.log(`$ Redocly:`);
    this.log(`$ cd redocly && npm start`);
    this.log(`$ http://localhost:8080`);
  }
};
