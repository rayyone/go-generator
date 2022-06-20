/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const ArtifactGenerator = require('../../lib/artifact-generator');
const debug = require('../../lib/debug')('route-generator');
const chalk = require('chalk');
const helpers = require('../helpers');
const {
  fileExists,
  diDir,
  diRegDir,
  diRegSvcFile,
  newSvcImportPlaceholder,
  newSvcPlaceholder,
  newRoutePlaceholder,
  newRouteImportPlaceholder,
} = require('../helpers');
const path = require('path');

const ROUTE_TEMPLATE_PATH = 'route.go.ejs';
const CUSTOM_CHOICE_VALUE = 'RyCustomRoute';
const CLI_BASE_ROUTES = [
  {name: `Custom Route ${chalk.gray('(A custom route)')}`, value: CUSTOM_CHOICE_VALUE},
  {type: 'separator', line: '----- From Model... -----'},
];

/**
 * Route Generator
 *
 * Prompts for a Route name and route properties and creates the route class.
 * Currently, properties can only be added once to each route using the CLI (at
 * creation).
 *
 */
module.exports = class GoRouteGenerator extends ArtifactGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _setupGenerator() {
    this.artifactInfo = {
      type: 'route',
      rootDir: helpers.sourceRootDir,
    };

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
    return super.promptBaseModel(CLI_BASE_ROUTES, CUSTOM_CHOICE_VALUE);
  }

  // Prompt a user for Route Name
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
    super.getOutDir(helpers.routeDir);
  }

  async scaffold() {
    if (this.shouldExit()) return false;

    debug('scaffolding');

    this.artifactInfo.outFile = helpers.getRouteFileName(this.artifactInfo.className);

    // Resolved Output Path
    const outputPath = this.destinationPath(this.artifactInfo.outDir, this.artifactInfo.outFile);
    if (await fileExists(outputPath)) {
      await super._replacePlaceholderToFiles(
        outputPath,
        path.resolve(__dirname, `./templates/add-route.ejs`),
        newRoutePlaceholder,
        `pvGroup.GET("${this.artifactInfo.pluralSnakeName}", ctl.${this.artifactInfo.pascalName}.All)`,
      );
    } else {
      this.copyTemplatedFiles(this.templatePath(ROUTE_TEMPLATE_PATH), outputPath, this.artifactInfo);
    }

    const generalRoutePath = this.destinationPath(helpers.sourceRootDir, 'routes', 'init.go');
    await super._replacePlaceholderToFiles(
      generalRoutePath,
      path.resolve(__dirname, `./templates/import-dep.ejs`),
      newRouteImportPlaceholder,
      `"${this.artifactInfo.appModName}/app/domain/${this.artifactInfo.domainName}/route"`,
    );

    await super._replacePlaceholderToFiles(
      generalRoutePath,
      path.resolve(__dirname, `./templates/add-general-route.ejs`),
      newRoutePlaceholder,
      `${this.artifactInfo.domainPkgName}Route.New${this.artifactInfo.pascalDomainName}Route`,
    );

    this.outFiles = [outputPath, generalRoutePath];
  }

  async end() {
    await super.end();
    if (this.classOpts.hideHintWhenDone) {
      return;
    }
  }
};
