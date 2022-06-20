/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const ArtifactGenerator = require('../../lib/artifact-generator');
const debug = require('../../lib/debug')('repository-generator');
const chalk = require('chalk');
const path = require('path');
const g = require('../../lib/globalize');
const helpers = require('../helpers');
const {
  gormDir,
  diDir,
  diRegDir,
  diRegCtlFile,
  newCtlImportPlaceholder,
  newCtlPlaceholder,
  diRegRepoFile,
  newRepoImportPlaceholder,
  newRepoPlaceholder,
  newRepoBindPlaceholder,
  foundationCtnCtlFile,
  foundationCtnRepoFile,
  newGormImportPlaceholder,
} = require('../helpers');

const REPOSITORY_TEMPLATE_PATH = 'repo.go.ejs';
const GORM_TEMPLATE_PATH = 'gorm.go.ejs';
const CUSTOM_CHOICE_VALUE = 'RyCustomRepo';
const CLI_BASE_REPOSITORIES = [
  {name: `Custom Repository ${chalk.gray('(A custom repository)')}`, value: CUSTOM_CHOICE_VALUE},
  {type: 'separator', line: '----- From Model... -----'},
];

module.exports = class GoRepositoryGenerator extends ArtifactGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    this.artifactInfo = {
      type: 'repository',
      rootDir: helpers.sourceRootDir,
    };

    this.artifactInfo.outDir = path.resolve(this.artifactInfo.rootDir, helpers.repositoryDir);

    this.artifactInfo.repositoryDir = path.resolve(this.artifactInfo.rootDir, helpers.repositoryDir);

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
    return super.promptBaseModel(CLI_BASE_REPOSITORIES, CUSTOM_CHOICE_VALUE);
  }

  // Prompt a user for Repository Name
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
    super.getOutDir(helpers.repositoryDir);
  }

  async scaffold() {
    if (this.shouldExit()) return false;

    debug('scaffolding');

    // Data for templates
    this.artifactInfo.outFile = helpers.getRepositoryFileName(this.artifactInfo.className);

    const repoOutputPath = this.destinationPath(this.artifactInfo.outDir, this.artifactInfo.outFile);

    this.copyTemplatedFiles(this.templatePath(REPOSITORY_TEMPLATE_PATH), repoOutputPath, this.artifactInfo);

    const gormOutputPath = this.destinationPath(this.artifactInfo.outDir, gormDir, this.artifactInfo.outFile);

    this.copyTemplatedFiles(this.templatePath(GORM_TEMPLATE_PATH), gormOutputPath, this.artifactInfo);

    this.outFiles = [repoOutputPath, gormOutputPath];

    const updateFiles = [
      {
        path: this.destinationPath(diDir, diRegDir, diRegRepoFile),
        tplPath: path.resolve(__dirname, `./templates/import-repo.ejs`),
        placeholder: newRepoImportPlaceholder,
        skip: `"${this.artifactInfo.appModName}/app/domain/${this.artifactInfo.domainName}/repo"`,
      },
      {
        path: this.destinationPath(diDir, diRegDir, diRegRepoFile),
        tplPath: path.resolve(__dirname, `./templates/import-gorm.ejs`),
        placeholder: newGormImportPlaceholder,
        skip: `"${this.artifactInfo.appModName}/app/domain/${this.artifactInfo.domainName}/repo/gorm"`,
      },
      {
        path: this.destinationPath(diDir, diRegDir, diRegRepoFile),
        tplPath: path.resolve(__dirname, `./templates/add-repo.ejs`),
        placeholder: newRepoPlaceholder,
        skip: `${this.artifactInfo.domainPkgName}g.New${this.artifactInfo.pascalName}Gorm`,
      },
      {
        path: this.destinationPath(diDir, diRegDir, diRegRepoFile),
        tplPath: path.resolve(__dirname, `./templates/bind-repo.ejs`),
        placeholder: newRepoBindPlaceholder,
        skip: `new(${this.artifactInfo.domainPkgName}rp.${this.artifactInfo.pascalName})`,
      },
      {
        path: this.destinationPath(foundationCtnRepoFile),
        tplPath: path.resolve(__dirname, `./templates/import-repo.ejs`),
        placeholder: newRepoImportPlaceholder,
        skip: `"${this.artifactInfo.appModName}/app/domain/${this.artifactInfo.domainName}/repo"`,
      },
      {
        path: this.destinationPath(foundationCtnRepoFile),
        tplPath: path.resolve(__dirname, `./templates/add-ctn-repo.ejs`),
        placeholder: newRepoPlaceholder,
        skip: `${this.artifactInfo.domainPkgName}rp.${this.artifactInfo.pascalName}`,
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
    this.log(`Rerun the app to migrate new tables`);
    this.log();
  }
};
