/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const ArtifactGenerator = require('../../lib/artifact-generator');
const debug = require('../../lib/debug')('resource-generator');
const path = require('path');
const helpers = require('../helpers');
const g = require('../../lib/globalize');
const chalk = require('chalk');

module.exports = class ResourceGenerator extends ArtifactGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    this.artifactInfo = {
      type: 'resource',
      rootDir: helpers.sourceRootDir,
    };
  }

  setOptions() {
    return super.setOptions();
  }

  async getAppConfig() {
    await super.getAppConfig();
  }

  async promptArtifactName() {
    await super.promptArtifactName();
  }

  async promptDomainName() {
    await super.promptBaseDomain();
  }

  scaffold() {
    if (this.shouldExit()) return false;

    debug('scaffolding');
    this.composeWith(path.join(__dirname, '../model'), [this.artifactInfo.name, this.artifactInfo.domainName], {
      hideHintWhenDone: true,
    });
  }

  async end() {
    this.classOpts.hideHintWhenDone = true;
    this.composeWith(path.join(__dirname, '../request'), [
      this.artifactInfo.name,
      this.artifactInfo.domainName,
      {hideHintWhenDone: true},
    ]);
    this.composeWith(path.join(__dirname, '../transformer'), [
      this.artifactInfo.name,
      this.artifactInfo.domainName,
      {hideHintWhenDone: true},
    ]);
    this.composeWith(path.join(__dirname, '../controller'), [
      this.artifactInfo.name,
      this.artifactInfo.domainName,
      {hideHintWhenDone: true, notWireDeps: true},
    ]);
    this.composeWith(path.join(__dirname, '../repository'), [
      this.artifactInfo.name,
      this.artifactInfo.domainName,
      {hideHintWhenDone: true, notWireDeps: true},
    ]);
    this.composeWith(path.join(__dirname, '../service'), [
      this.artifactInfo.name,
      this.artifactInfo.domainName,
      {hideHintWhenDone: true, notWireDeps: true},
    ]);
    this.composeWith(path.join(__dirname, '../migration'), [
      this.artifactInfo.name,
      this.artifactInfo.domainName,
      {hideHintWhenDone: true},
    ]);
    this.composeWith(path.join(__dirname, '../route'), [
      this.artifactInfo.name,
      this.artifactInfo.domainName,
      {hideHintWhenDone: true},
    ]);
    await super.end();

    await super.wireDeps();

    this.log();
    this.log(g.f(chalk.blueBright('Next steps:')));
    this.log();
    this.log(chalk.blueBright(`Add new migration files`));
    this.log();
    this.log(chalk.blueBright(`Rerun the app to migrate new tables`));
    this.log();
  }
};
