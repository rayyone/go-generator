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
const chalk = require('chalk');

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
    this.log(chalk.yellow(g.f('Application %s was created in %s.', this.projectInfo.name, this.projectInfo.outdir)));
    this.log();
    try {
      this.log(chalk.yellow(`go mod tidy`));
      await this.spawnCommand('go', ['mod', 'tidy']);
      this.log(chalk.yellow(`go mod vendor`));
      await this.spawnCommand('go', ['mod', 'vendor']);
      await this.spawnCommand('./bash/swagger.sh', [], {stdio: [process.stdin, 'ignore', process.stderr]});
      await this.spawnCommand('./bash/wire.sh', [], {stdio: [process.stdin, 'ignore', process.stderr]});
    } catch (e) {
      this.log(e);
      this.log(chalk.red('Something went wrong when trying to setup the project.'));
      this.log('Please run these commands manually:');
      this.log(chalk.yellow(`cd ${this.projectInfo.outdir}`));
      this.log(chalk.yellow(`go mod tidy && go mod vendor`));
      this.log(chalk.yellow(`./bash/swagger.sh`));
      this.log(chalk.yellow(`./bash/wire.sh`));
    }
    this.log();
    this.log(g.f('Next steps:'));
    this.log(chalk.yellow(`cd ${this.projectInfo.outdir}`));
    this.log();
    this.log(`Update database connection at ./config.yml`);
    this.log();
    this.log(`Enjoy coding:`);
    this.log(chalk.yellow(`air`));
    this.log();
    this.log('=================================================');
    this.log('Data seeder:');
    this.log(chalk.yellow(`go run cmd/seeder/main.go`));
    this.log(chalk.blue(`API health check: http://localhost:${this.projectInfo.projectPort}/ping`));
    this.log(chalk.blue(`Swagger: http://localhost:${this.projectInfo.projectPort}/ba/swagger/index.html`));
    this.log(chalk.blue(`Redocly:`));
    this.log(chalk.yellow(`cd redocly && npm start`));
    this.log(chalk.blue(`http://localhost:8080`));
  }
};
