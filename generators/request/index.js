/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const ArtifactGenerator = require('../../lib/artifact-generator');
const debug = require('../../lib/debug')('request-generator');
const chalk = require('chalk');
const path = require('path');
const helpers = require('../helpers');

const REQUEST_TEMPLATE_PATH = 'request.go.ejs';
const CUSTOM_CHOICE_VALUE = 'RyCustomRequest';
const CLI_BASE_REQUESTS = [
  {name: `Custom Request ${chalk.gray('(A custom request)')}`, value: CUSTOM_CHOICE_VALUE},
  {type: 'separator', line: '----- From Model... -----'},
];

module.exports = class RequestGenerator extends ArtifactGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    this.artifactInfo = {
      type: 'request',
      rootDir: helpers.sourceRootDir,
    };

    this.artifactInfo.requestDir = path.resolve(this.artifactInfo.rootDir, helpers.requestDir);

    this.artifactInfo.modelDir = path.resolve(this.artifactInfo.rootDir, helpers.modelDir);
    this.artifactInfo.helpers = helpers;

    return super._setupGenerator();
  }

  setOptions() {
    return super.setOptions();
  }

  async getAppConfig() {
    await super.getAppConfig();
  }

  async promptBaseModel() {
    return super.promptBaseModel(CLI_BASE_REQUESTS, CUSTOM_CHOICE_VALUE);
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
    super.getOutDir(helpers.requestDir);
  }

  scaffold() {
    if (this.shouldExit()) return false;

    debug('scaffolding');

    this.artifactInfo.outFile = helpers.getRequestFileName(this.artifactInfo.className);

    // Resolved Output Path
    const outputPath = this.destinationPath(this.artifactInfo.outDir, this.artifactInfo.outFile);
    this.outFiles = [outputPath];
    this.copyTemplatedFiles(this.templatePath(REQUEST_TEMPLATE_PATH), outputPath, this.artifactInfo);
  }

  async end() {
    await super.end();
    if (this.classOpts.hideHintWhenDone) {
      return;
    }
  }
};
