/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const ArtifactGenerator = require('../../lib/artifact-generator');
const debug = require('../../lib/debug')('migration-generator');
const chalk = require('chalk');
const path = require('path');
const helpers = require('../helpers');
const {format2Digit} = require('../helpers');
const {snakeCase} = require('change-case');
const _ = require('lodash');
const MIGRATION_TEMPLATE_PATH = 'migration.go.ejs';
const CUSTOM_CHOICE_VALUE = 'RyCustomMigration';
const CLI_BASE_MIGRATIONS = [
  {name: `Custom Migration ${chalk.gray('(A custom migration)')}`, value: CUSTOM_CHOICE_VALUE},
  {type: 'separator', line: '----- From Model... -----'},
];

module.exports = class MigrationGenerator extends ArtifactGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    this.artifactInfo = {
      type: 'migration',
      rootDir: helpers.sourceRootDir,
      databaseRootDir: helpers.databaseRootDir,
    };
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
    return super.promptBaseModel(CLI_BASE_MIGRATIONS, CUSTOM_CHOICE_VALUE);
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

  async promptPropertyName() {
    if (this.artifactInfo.isCustomChoice) {
      await super.promptPropertyName();
      this.artifactInfo.modelScheme.props = this.artifactInfo.newProps
    }
    return;
  }

  getMigrationID() {

    const now = new Date();
    const year = now.getFullYear();
    const month = format2Digit(now.getMonth() + 1);
    const day = format2Digit(now.getDate());
    const hour = format2Digit(now.getHours());
    const minute = format2Digit(now.getMinutes());
    const fullDatetime = [year, month, day, hour, minute].join('');
    if (this.artifactInfo.isCustomChoice && _.isUndefined(this.artifactInfo.name)) {
      this.artifactInfo.name = _.get(this.artifactInfo, 'modelScheme.tableName')
      this.generateNameCaseStyles()
    }
    this.artifactInfo.migrationID = `${fullDatetime}_${this.artifactInfo.domainPkgName}_create_${snakeCase(
      this.artifactInfo.name,
    )}_table`;
  }

  getOutDir() {
    super.getOutDir(path.resolve(helpers.sourceRootDir, helpers.databaseDir, helpers.migrationDir));
  }

  async scaffold() {
    if (this.shouldExit()) return false;

    debug('scaffolding');

    // Data for templates
    this.artifactInfo.outFile = helpers.getMigrationFileName(this.artifactInfo.migrationID);

    // Resolved Output Path
    const outputPath = this.destinationPath(this.artifactInfo.outDir, this.artifactInfo.outFile);

    this.outFiles = [outputPath];

    this.copyTemplatedFiles(this.templatePath(MIGRATION_TEMPLATE_PATH), outputPath, this.artifactInfo);
  }

  async end() {
    await super.end();
    if (this.classOpts.hideHintWhenDone) {
      return;
    }
  }
};
