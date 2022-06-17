/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const ArtifactGenerator = require('../../lib/artifact-generator');
const debug = require('../../lib/debug')('model-generator');
const utils = require('../../lib/utils');
const chalk = require('chalk');
const path = require('path');
const g = require('../../lib/globalize');
const {createPropertyTemplateData} = require('./property-definition');
const {
  golangTypeChoices,
  dbFilterChoices,
  configDir,
  ryConfigModelDir,
  ryConfigDir,
  modelDir,
  sourceRootDir,
  getModelFileName,
  getModelSchemeFileName,
} = require('../helpers');
const {generateNewProps} = require('../gen-config/templates/converter');

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

    this.artifactInfo.modelDir = path.resolve(this.artifactInfo.rootDir, modelDir);

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
    if (this.shouldExit()) return false;

    this.log(g.f('Enter an empty property name when done'));
    this.log(g.f('Input the same property name to override a previous one'));
    this.log();

    // This function can be called repeatedly so this deletes the previous
    // property name if one was set.
    delete this.propName;

    const prompts = [
      {
        name: 'propName',
        message: g.f('Enter the property name: (snake_case/camelCase does matter!)'),
        validate: function (val) {
          if (val) {
            return utils.checkPropertyName(val);
          } else {
            return true;
          }
        },
      },
    ];

    const answers = await this.prompt(prompts);
    debug(`propName => ${JSON.stringify(answers)}`);
    if (answers.propName) {
      this.artifactInfo.properties[answers.propName] = {};
      this.propName = answers.propName;
    }
    return this._promptPropertyInfo();
  }

  _generateProperties() {
    const propDefs = this.artifactInfo.properties;
    this.artifactInfo.properties = {};
    for (const key in propDefs) {
      this.artifactInfo.properties[key] = createPropertyTemplateData(propDefs[key], key);
    }
    this.artifactInfo.newProps = generateNewProps(this.artifactInfo.properties);
  }
  // Internal Method. Called when a new property is entered.
  // Prompts the user for more information about the property to be added.
  async _promptPropertyInfo() {
    if (!this.propName) {
      this._generateProperties();
      return true;
    } else {
      const prompts = [
        {
          name: 'type',
          message: g.f('Property type:'),
          type: 'list',
          choices: golangTypeChoices,
        },
        {
          name: 'itemType',
          message: g.f('Type of array items:'),
          type: 'list',
          choices: golangTypeChoices.filter(choice => {
            return choice !== 'array';
          }),
          when: answers => {
            return answers.type === 'array';
          },
        },
        {
          name: 'required',
          message: g.f('Is it required?:'),
          type: 'confirm',
          default: true,
        },
        {
          name: 'filterable',
          message: g.f('Is it filterable?:'),
          type: 'confirm',
          default: true,
        },
        {
          name: 'filterType',
          message: g.f('Filter type?:'),
          type: 'list',
          choices: dbFilterChoices,
          when: answers => {
            return answers.filterable === true;
          },
        },
      ];

      const answers = await this.prompt(prompts);
      debug(`propertyInfo => ${JSON.stringify(answers)}`);

      Object.assign(this.artifactInfo.properties[this.propName], answers);

      this.log();
      this.log(g.f("Let's add another property to %s", `${chalk.yellow(this.artifactInfo.className)}`));
      return this.promptPropertyName();
    }
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
  }

  async end() {
    await super.end();
    if (!this.classOpts.hintAtTheEnd) {
      return;
    }
  }
};
