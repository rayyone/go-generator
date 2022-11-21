/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const ArtifactGenerator = require('../../lib/artifact-generator');
const debug = require('../../lib/debug')('model-generator');
const path = require('path');
const g = require('../../lib/globalize');
const {
  configDir,
  ryConfigModelDir,
  ryConfigDir,
  modelDir,
  sourceRootDir,
  getModelFileName,
  getModelSchemeFileName,
} = require('../helpers');
const helpers = require("../helpers");

const MODEL_TEMPLATE_PATH = 'model.go.ejs';

module.exports = class ModelGenerator extends ArtifactGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    this.artifactInfo = {
      ...(this.artifactInfo || {}),
      type: 'model',
      rootDir: sourceRootDir,
    };

    this.artifactInfo.outDir = path.resolve(this.artifactInfo.rootDir, modelDir);

    this.artifactInfo.modelSchemeOutDir = path.resolve(this.destinationPath(), ryConfigDir, ryConfigModelDir);

    this.artifactInfo.properties = {};
    this.artifactInfo.softDeletes = false;


    this.artifactInfo.modelDir = path.resolve(this.artifactInfo.rootDir, modelDir);

    this.artifactInfo.listPackageImport = helpers.getListPackage();
    return super._setupGenerator();
  }

  setOptions() {
    return super.setOptions();
  }

  async getAppConfig() {
    await super.getAppConfig();
  }

  async promptArtifactName() {
    if (this.modelName) {
      this.artifactInfo.isCustomChoice = false;
      this.artifactInfo.name = this.modelName;
      // Prompt warning msg for the name
      this.promptWarningMsgForName();
    } else {
      await super.promptArtifactName();
    }
  }

  generateArtifactModelNames() {
    super.generateNameCaseStyles(this.artifactInfo.name);
  }

  async promptTableName() {
    if (this.shouldExit()) return;
    const prompts = [
      {
        name: 'tableName',
        message: g.f('Enter the table name:'),
        default: this.artifactInfo.tableName,
      },
    ];

    const answers = await this.prompt(prompts);
    this.artifactInfo.tableName = answers.tableName;
  }

  async promptDomainName() {
    await super.promptBaseDomain();
  }

  async promptPropertyName() {
    return super.promptPropertyName()
  }

  async promptAddSoftDelete() {
    if (this.shouldExit()) return false;

    const prompts = [
      {
        name: 'softDeletes',
        message: g.f('Model has soft-delete?'),
        type: 'confirm',
        default: true,
      },
    ];

    const answers = await this.prompt(prompts);
    this.artifactInfo.softDeletes = answers.softDeletes
  }
  async scaffold() {
    if (this.shouldExit()) return false;

    debug('scaffolding');

    // Data for templates
    this.artifactInfo.outFile = getModelFileName(this.artifactInfo.name);
    const outputPath = this.destinationPath(this.artifactInfo.outDir, this.artifactInfo.outFile);
    this.copyTemplatedFiles(this.templatePath(MODEL_TEMPLATE_PATH), outputPath, this.artifactInfo);

    this.artifactInfo.modelSchemeOutFile = getModelSchemeFileName(this.artifactInfo.name);
    const outputModelSchemePath = this.destinationPath(
      this.artifactInfo.modelSchemeOutDir,
      this.artifactInfo.modelSchemeOutFile,
    );

    this.copyTemplatedFiles(
      path.resolve(__dirname, `../${configDir}/templates/model-scheme.js.ejs`),
      outputModelSchemePath,
      this.artifactInfo,
    );

    this.outFiles = [outputPath];
  }

  async end() {
    await super.end();
    if (this.classOpts.hideHintWhenDone) {
      return;
    }
  }
};
