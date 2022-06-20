/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const ArtifactGenerator = require('../../lib/artifact-generator');
const debug = require('../../lib/debug')('transformer-generator');
const chalk = require('chalk');
const path = require('path');
const g = require('../../lib/globalize');
const helpers = require('../helpers');

const TRANSFORMER_TEMPLATE_PATH = 'transformer.go.ejs';
const CUSTOM_CHOICE_VALUE = 'RyCustomTransformer';
const CLI_BASE_TRANSFORMERS = [
  {name: `Custom Transformer ${chalk.gray('(A custom transformer)')}`, value: CUSTOM_CHOICE_VALUE},
  {type: 'separator', line: '----- From Model... -----'},
];

/**
 * Transformer Generator
 *
 * Prompts for a Transformer name and transformer properties and creates the transformer class.
 * Currently, properties can only be added once to each transformer using the CLI (at
 * creation).
 *
 */
module.exports = class GoTransformerGenerator extends ArtifactGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    this.artifactInfo = {
      type: 'transformer',
      rootDir: helpers.sourceRootDir,
    };

    this.artifactInfo.outDir = path.resolve(this.artifactInfo.rootDir, helpers.transformerDir);

    this.artifactInfo.transformerDir = path.resolve(this.artifactInfo.rootDir, helpers.transformerDir);

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
    return super.promptBaseModel(CLI_BASE_TRANSFORMERS, CUSTOM_CHOICE_VALUE);
  }

  // Prompt a user for Transformer Name
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
    super.getOutDir(helpers.transformerDir);
  }

  scaffold() {
    if (this.shouldExit()) return false;

    debug('scaffolding');

    // Data for templates
    this.artifactInfo.outFile = helpers.getTransformerFileName(this.artifactInfo.className);

    // Resolved Output Path
    const outputPath = this.destinationPath(this.artifactInfo.outDir, this.artifactInfo.outFile);

    this.copyTemplatedFiles(this.templatePath(TRANSFORMER_TEMPLATE_PATH), outputPath, this.artifactInfo);

    this.outFiles = [outputPath];
  }

  async end() {
    await super.end();
    if (!this.classOpts.hintAtTheEnd) {
      return;
    }
  }
};
