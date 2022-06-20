/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const ArtifactGenerator = require('../../lib/artifact-generator');
const debug = require('../../lib/debug')('controller-generator');
const chalk = require('chalk');
const path = require('path');
const g = require('../../lib/globalize');
const helpers = require('../helpers');
const {camelCase} = require('change-case');
const {
  diDir,
  diRegDir,
  diRegCtlFile,
  newCtlImportPlaceholder,
  newCtlPlaceholder,
  foundationCtnCtlFile,
} = require('../helpers');

const CONTROLLER_TEMPLATE_PATH = 'controller.go.ejs';
const CUSTOM_CHOICE_VALUE = 'RyCustomController';
const CLI_BASE_CONTROLLERS = [
  {name: `Custom Controller ${chalk.gray('(A custom controller)')}`, value: CUSTOM_CHOICE_VALUE},
  {type: 'separator', line: '----- From Model... -----'},
];

module.exports = class GoControllerGenerator extends ArtifactGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    this.artifactInfo = {
      type: 'controller',
      rootDir: helpers.sourceRootDir,
    };

    this.artifactInfo.outDir = path.resolve(this.artifactInfo.rootDir, helpers.controllerDir);

    this.artifactInfo.controllerDir = path.resolve(this.artifactInfo.rootDir, helpers.controllerDir);

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
    return super.promptBaseModel(CLI_BASE_CONTROLLERS, CUSTOM_CHOICE_VALUE);
  }

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
    super.getOutDir(helpers.controllerDir);
  }

  async scaffold() {
    if (this.shouldExit()) return false;

    debug('scaffolding');

    // Data for templates
    this.artifactInfo.outFile = helpers.getControllerFileName(this.artifactInfo.className);

    // Resolved Output Path
    const outputPath = this.destinationPath(this.artifactInfo.outDir, this.artifactInfo.outFile);

    this.artifactInfo.worldName = camelCase(this.artifactInfo.name);

    this.copyTemplatedFiles(this.templatePath(CONTROLLER_TEMPLATE_PATH), outputPath, this.artifactInfo);

    const updateFiles = [
      {
        path: this.destinationPath(diDir, diRegDir, diRegCtlFile),
        tplPath: path.resolve(__dirname, `./templates/import-dep.ejs`),
        placeholder: newCtlImportPlaceholder,
        skip: `"${this.artifactInfo.appModName}/app/domain/${this.artifactInfo.domainName}/controller"`,
      },
      {
        path: this.destinationPath(diDir, diRegDir, diRegCtlFile),
        tplPath: path.resolve(__dirname, `./templates/add-ctl.ejs`),
        placeholder: newCtlPlaceholder,
        skip: `${this.artifactInfo.domainPkgName}ctl.New${this.artifactInfo.pascalName}Ctl`,
      },
      {
        path: this.destinationPath(foundationCtnCtlFile),
        tplPath: path.resolve(__dirname, `./templates/import-dep.ejs`),
        placeholder: newCtlImportPlaceholder,
        skip: `"${this.artifactInfo.appModName}/app/domain/${this.artifactInfo.domainName}/controller"`,
      },
      {
        path: this.destinationPath(foundationCtnCtlFile),
        tplPath: path.resolve(__dirname, `./templates/add-ctn-ctl.ejs`),
        placeholder: newCtlPlaceholder,
        skip: `${this.artifactInfo.domainPkgName}ctl.${this.artifactInfo.pascalName}Ctl`,
      },
    ];

    this.outFiles = [outputPath];
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
    if (!this.classOpts.hideHintWhenDone) {
    }
    if (!this.classOpts.notWireDeps) {
      await super.wireDeps();
    }
  }
};
