/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const debug = require('../../lib/debug')('new-prop-generator');
const path = require('path');
const helpers = require('../helpers');
const ModelGenerator = require('../model');
const {newPropsPlaceholder, configDir, getGormType, format2Digit, toGolangClassName} = require('../helpers');
const {toFileName} = require('../../lib/utils');
const g = require('../../lib/globalize');
const CUSTOM_CHOICE_VALUE = 'RyCustomNewProp';
const CLI_BASE_NEW_PROPS = [{type: 'separator', line: '----- From Model... -----'}];

const MIGRATION_ADD_COL_TEMPLATE_PATH = 'add-columns.go.ejs';

module.exports = class NewPropGenerator extends ModelGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    this.artifactInfo = {
      type: 'newProp',
      rootDir: helpers.sourceRootDir,
      databaseRootDir: helpers.databaseRootDir,
      listPackageImport: helpers.getListPackage(),
    };

    this.artifactInfo.modelDir = path.resolve(this.artifactInfo.rootDir, helpers.modelDir);

    this.artifactInfo.modelSchemeOutDir = path.resolve(this.destinationPath(), helpers.ryConfigDir);

    this.artifactInfo.migrationOutDir = path.resolve(this.artifactInfo.databaseRootDir, helpers.migrationDir);

    this.artifactInfo.getGormType = getGormType;

    return super._setupGenerator();
  }

  setOptions() {
    return super.setOptions();
  }

  async getAppConfig() {
    await super.getAppConfig();
  }

  async promptBaseModel() {
    return super.promptBaseModel(CLI_BASE_NEW_PROPS, CUSTOM_CHOICE_VALUE);
  }

  async promptPropertyName() {
    await super.promptPropertyName();
  }

  async loadModelScheme() {
    await super.getModelScheme();
  }

  async promptDomainName() {
    await super.promptBaseDomain();
  }

  getMigrationID() {
    const newCols = this.artifactInfo.newProps.map(i => i.propKey);
    const newColsStr = newCols.join('_');
    const now = new Date();
    const year = now.getFullYear();
    const month = format2Digit(now.getMonth() + 1);
    const day = format2Digit(now.getDate());
    const hour = format2Digit(now.getHours());
    const minute = format2Digit(now.getMinutes());
    const fullDatetime = [year, month, day, hour, minute].join('');
    this.artifactInfo.columnNames = toGolangClassName(newColsStr)
    this.artifactInfo.migrationID = `${fullDatetime}_${
      this.artifactInfo.domainPkgName
    }_add_${newColsStr}_to_${toFileName(this.artifactInfo.name)}`;
  }

  async scaffold() {
    if (this.shouldExit()) return false;
    debug('scaffolding');
    this.artifactInfo.modelScheme = {props: this.artifactInfo.newProps};
    const updateFiles = [
      {
        path: this.destinationPath(
          this.artifactInfo.modelDir,
          helpers.getModelFileName(this.artifactInfo.modelBaseClass),
        ),
        tplPath: path.resolve(__dirname, `../model/templates/print-props-tbl.ejs`),
        addImport: true,
      },
      {
        path: this.destinationPath(
          this.artifactInfo.modelSchemeOutDir,
          helpers.getModelSchemeFileName(this.artifactInfo.name),
        ),
        tplPath: path.resolve(__dirname, `../${configDir}/templates/print-props.ejs`),
        addImport: false,
      },
      {
        path: this.destinationPath(
          super.getDestDir(helpers.requestDir),
          helpers.getRequestFileName(this.artifactInfo.name),
        ),
        tplPath: path.resolve(__dirname, `../request/templates/print-props.ejs`),
        addImport: true,
      },
      {
        path: this.destinationPath(
          super.getDestDir(helpers.repositoryDir, helpers.gormDir),
          helpers.getRepositoryFileName(this.artifactInfo.name),
        ),
        tplPath: path.resolve(__dirname, `../repository/templates/print-props.ejs`),
        addImport: false,
      },
    ];
    this.outFiles = [];
    for (const updateFile of updateFiles) {
      this.outFiles.push(updateFile.path);
      await super._replacePlaceholderToFiles(updateFile.path, updateFile.tplPath, newPropsPlaceholder);
      if (updateFile.addImport) {
        await this._addNewPackage(updateFile.path, this.artifactInfo.modelScheme.props);
      }
    }
    this.artifactInfo.migrationOutFile = helpers.getMigrationFileName(this.artifactInfo.migrationID);
    const migrationOutputPath = this.destinationPath(
      this.artifactInfo.migrationOutDir,
      this.artifactInfo.migrationOutFile,
    );
    this.artifactInfo.type = 'newProp'

    this.copyTemplatedFiles(
      path.resolve(__dirname, `../migration/templates/${MIGRATION_ADD_COL_TEMPLATE_PATH}`),
      migrationOutputPath,
      this.artifactInfo,
    );

    this.outFiles.push(migrationOutputPath);
  }

  async end() {
    await super.end();
    this.log('Warning: You should update Swagger API document for new props');
    this.log();
    this.log(g.f('Next steps:'));
    this.log(`Rerun the app to migrate new tables`);
    this.log();
  }
};
