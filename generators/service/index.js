/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const ArtifactGenerator = require('../../lib/artifact-generator');
const debug = require('../../lib/debug')('service-generator');
const chalk = require('chalk');
const path = require('path');
const helpers = require('../helpers');
const {
  diDir,
  diRegDir,
  diRegSvcFile,
  newSvcPlaceholder,
  newSvcImportPlaceholder,
  foundationCtnCtlFile,
  newCtlImportPlaceholder,
  newCtlPlaceholder,
  foundationCtnSvcFile,
} = require('../helpers');
const g = require('../../lib/globalize');

const SERVICE_TEMPLATE_PATH = 'service.go.ejs';
const CUSTOM_CHOICE_VALUE = 'RyCustomService';
const CLI_BASE_SERVICES = [
  {name: `Custom Service ${chalk.gray('(A custom service)')}`, value: CUSTOM_CHOICE_VALUE},
  {type: 'separator', line: '----- From Model... -----'},
];

module.exports = class GoServiceGenerator extends ArtifactGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    this.artifactInfo = {
      type: 'service',
      rootDir: helpers.sourceRootDir,
    };

    this.artifactInfo.outDir = path.resolve(this.artifactInfo.rootDir, helpers.serviceDir);

    this.artifactInfo.serviceDir = path.resolve(this.artifactInfo.rootDir, helpers.serviceDir);

    this.artifactInfo.modelDir = path.resolve(this.artifactInfo.rootDir, helpers.modelDir);

    return super._setupGenerator();
  }

  setOptions() {
    return super.setOptions();
  }

  async getAppConfig() {
    await super.getAppConfig();
  }

  async promptBaseModel() {
    return super.promptBaseModel(CLI_BASE_SERVICES, CUSTOM_CHOICE_VALUE);
  }

  // Prompt a user for Service Name
  async promptArtifactName() {
    await super.promptArtifactName();
  }

  async loadModelScheme() {
    await super.getModelScheme();
  }

  async promptDomainName() {
    await super.promptBaseDomain();
  }

  getOutDir() {
    super.getOutDir(helpers.serviceDir);
  }

  async scaffold() {
    if (this.shouldExit()) return false;

    debug('scaffolding');

    // Data for templates
    this.artifactInfo.outFile = helpers.getServiceFileName(this.artifactInfo.className);

    // Resolved Output Path
    const outputPath = this.destinationPath(this.artifactInfo.outDir, this.artifactInfo.outFile);

    this.copyTemplatedFiles(this.templatePath(SERVICE_TEMPLATE_PATH), outputPath, this.artifactInfo);

    this.outFiles = [outputPath];

    const updateFiles = [
      {
        path: this.destinationPath(diDir, diRegDir, diRegSvcFile),
        tplPath: path.resolve(__dirname, `./templates/import-dep.ejs`),
        placeholder: newSvcImportPlaceholder,
        skip: `"${this.artifactInfo.appModName}/app/domain/${this.artifactInfo.domainName}/service"`,
      },
      {
        path: this.destinationPath(diDir, diRegDir, diRegSvcFile),
        tplPath: path.resolve(__dirname, `./templates/add-svc.ejs`),
        placeholder: newSvcPlaceholder,
        skip: `${this.artifactInfo.domainPkgName}svc.New${this.artifactInfo.pascalName}Svc`,
      },
      {
        path: this.destinationPath(foundationCtnSvcFile),
        tplPath: path.resolve(__dirname, `./templates/import-dep.ejs`),
        placeholder: newSvcImportPlaceholder,
        skip: `"${this.artifactInfo.appModName}/app/domain/${this.artifactInfo.domainName}/service"`,
      },
      {
        path: this.destinationPath(foundationCtnSvcFile),
        tplPath: path.resolve(__dirname, `./templates/add-ctn-svc.ejs`),
        placeholder: newSvcPlaceholder,
        skip: `${this.artifactInfo.domainPkgName}svc.${this.artifactInfo.pascalName}Svc`,
      },
    ];

    for (const updateFile of updateFiles) {
      this.outFiles.push(updateFile.path);
      await super._replacePlaceholderToFiles(
        updateFile.path,
        updateFile.tplPath,
        updateFile.placeholder,
        updateFile.skip,
      );
    }
  }

  async end() {
    await super.end();
    if (!this.classOpts.hintAtTheEnd) {
      return;
    }
    this.log();
    this.log(g.f('Next steps: Wire dependencies'));
    this.log('$ ./bash/wire.sh');
    this.log();
    this.log('Generate swagger doc:');
    this.log('$ ./bash/swagger.sh');
    this.log();
  }
};
