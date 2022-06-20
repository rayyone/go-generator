'use strict';
const BaseGenerator = require('./base-generator');
const debug = require('./debug')('artifact-generator');
const utils = require('./utils');
const path = require('path');
const chalk = require('chalk');
const g = require('./globalize');
const helpers = require('../generators/helpers');
const {pluralize} = require('./utils');
const {snakeCase, pascalCase} = require('change-case');
const {
  fileExists,
  getModelSchemeFileName,
  toGolangClassName,
  ryConfigDir,
  newPropsPlaceholder,
  ryConfigModelDir,
  domainDir,
  sourceDomainDir,
  newCtlPlaceholder,
  newCtlImportPlaceholder,
  newSvcPlaceholder,
  newSvcImportPlaceholder,
  newRepoPlaceholder,
  newRepoImportPlaceholder,
  newRepoBindPlaceholder,
  newGormImportPlaceholder,
  newRouteImportPlaceholder,
  newRoutePlaceholder,
  newMigrationPlaceholder,
} = require('../generators/helpers');

const PROMPT_BASE_MODEL_CLASS = g.f('Please select the model base class');
const PROMPT_BASE_DOMAIN_CLASS = g.f('Please select the domain base');

module.exports = class ArtifactGenerator extends BaseGenerator {
  // Note: arguments and options should be defined in the constructor.
  constructor(args, opts) {
    super(args, opts);
    // how classes are separated when the output contains more than one
    this.classNameSeparator = ', ';
    this.classOpts = {};
    if (args && args.length > 0) {
      const [modelName, domainName, options] = args;
      this.modelName = modelName;
      this.artifactInfo = this.artifactInfo || {};
      this.artifactInfo.domainName = domainName;
      const {hintAtTheEnd} = options || {};
      this.classOpts = {
        hintAtTheEnd,
      };
    }
  }

  _setupGenerator() {
    super._setupGenerator();

    this.artifactInfo.newPropsPlaceholder = newPropsPlaceholder;
    this.artifactInfo.newMigrationPlaceholder = newMigrationPlaceholder;
    this.artifactInfo.newCtlPlaceholder = newCtlPlaceholder;
    this.artifactInfo.newCtlImportPlaceholder = newCtlImportPlaceholder;
    this.artifactInfo.newSvcPlaceholder = newSvcPlaceholder;
    this.artifactInfo.newSvcImportPlaceholder = newSvcImportPlaceholder;
    this.artifactInfo.newRepoPlaceholder = newRepoPlaceholder;
    this.artifactInfo.newRepoImportPlaceholder = newRepoImportPlaceholder;
    this.artifactInfo.newGormImportPlaceholder = newGormImportPlaceholder;
    this.artifactInfo.newRepoBindPlaceholder = newRepoBindPlaceholder;
    this.artifactInfo.newRouteImportPlaceholder = newRouteImportPlaceholder;
    this.artifactInfo.newRoutePlaceholder = newRoutePlaceholder;

    this.argument('name', {
      type: String,
      required: false,
      description: g.f('Name for the %s', this.artifactInfo.type),
    });
  }

  setOptions() {
    const name = this.options.name;
    if (name) {
      const validationMsg = utils.validateClassName(name);
      if (typeof validationMsg === 'string') throw new Error(validationMsg);
    }

    this.artifactInfo.isCustomChoice = true;

    this.artifactInfo.name = name;

    return super.setOptions();
  }

  async promptArtifactName() {
    debug('Prompting for artifact name');
    if (this.shouldExit()) return false;

    if (!this.artifactInfo.isCustomChoice) {
      return;
    }

    const prompts = [
      {
        type: 'input',
        name: 'name',
        message: g.f('%s name:', utils.toClassName(this.artifactInfo.type)),
        validate: utils.validateClassName,
      },
    ];

    await this.prompt(prompts).then(props => {
      Object.assign(this.artifactInfo, props);
      this.generateNameCaseStyles(this.artifactInfo.name);
      return props;
    });

    // Prompt warning msg for the name
    this.promptWarningMsgForName();
  }

  /**
   * remind user the input might get changed if it contains _ or accented char
   **/
  promptWarningMsgForName() {
    utils.logNamingIssues(this.artifactInfo.name, this.log.bind(this));
  }

  scaffold() {
    debug('Scaffolding artifact(s)');
    if (this.shouldExit()) return false;
    // Capitalize class name
    this.artifactInfo.name = utils.toClassName(this.artifactInfo.name);
    if (this.artifactInfo.outDir) {
      this.artifactInfo.relPath = path.relative(this.destinationPath(), this.artifactInfo.outDir);
    }

    // Copy template files from ./templates
    // Renaming of the files should be done in the generator inheriting from this one
    this.copyTemplatedFiles(this.templatePath('**/*'), this.destinationPath(), this.artifactInfo);
  }

  async end() {
    if (this.shouldExit()) {
      await super.end();
      return;
    }

    if (this.outFiles) {
      this.outFiles.forEach(out => {
        this.log(`Formatting ${out}`);
        this.spawnCommand('go', ['fmt', out]);
      });
    }

    if (this._isGenerationSuccessful()) {
      const classes = this.artifactInfo.name.split(this.classNameSeparator).map(utils.toClassName);
      const classesOutput = classes.join(this.classNameSeparator);
      this.log(
        g.f(
          '%s %s was/were created in %s',
          utils.toClassName(this.artifactInfo.type),
          chalk.yellow(classesOutput),
          this.artifactInfo.relPath || 'app',
        ),
      );
    }

    await super.end();
  }

  getOutDir(...dest) {
    const outDir = this.getDestDir(...dest);
    this.artifactInfo.outDir = outDir;
    this.artifactInfo.relPath = path.relative(this.destinationPath(), this.artifactInfo.outDir);

    return outDir;
  }

  getDestDir(...dest) {
    let out = '';
    const withDomain = [
      helpers.requestDir,
      helpers.controllerDir,
      helpers.transformerDir,
      helpers.serviceDir,
      helpers.repositoryDir,
      helpers.routeDir,
    ];
    if (withDomain.includes(dest[0])) {
      out = path.resolve(sourceDomainDir, this.artifactInfo.domainName, ...dest);
    } else {
      out = path.resolve(...dest);
    }
    return out;
  }

  async promptBaseModel(baseArtifacts, customChoice) {
    if (this.shouldExit()) return;
    if (this.modelName) {
      this.artifactInfo.isCustomChoice = false;
      this.artifactInfo.modelBaseClass = toGolangClassName(this.modelName);
      this.generateNameCaseStyles(this.artifactInfo.modelBaseClass);
      return;
    }

    const availableModels = [];
    let modelList = [];
    availableModels.push(...baseArtifacts);
    try {
      modelList = await helpers.getArtifactList(this.artifactInfo.modelDir, 'model');
      debug(`modelist ${modelList}`);

      if (modelList && modelList.length > 0) {
        availableModels.push(...modelList);
        debug(`availableModelBaseClasses ${availableModels}`);
      }
    } catch (err) {
      debug(`error ${err}`);
      return this.exit(err);
    }

    return this.prompt([
      {
        type: 'autocomplete',
        name: 'modelBaseClass',
        message: PROMPT_BASE_MODEL_CLASS,
        source: (answers, input) => helpers.fuzzySearch(answers, input, modelList, availableModels),
        default: availableModels[0],
        validate: utils.validateClassName,
      },
    ]).then(props => {
      this.artifactInfo.isCustomChoice = true;
      if (props.modelBaseClass !== customChoice) {
        this.artifactInfo.isCustomChoice = false;
        this.artifactInfo.modelBaseClass = props.modelBaseClass;
        this.generateNameCaseStyles(props.modelBaseClass);
      }
    });
  }

  async promptBaseDomain() {
    if (this.artifactInfo.domainName) {
      this.artifactInfo.domainPkgName = super.getDomainPkgName(this.artifactInfo.domainName);
      this.artifactInfo.pascalDomainName = pascalCase(this.artifactInfo.domainName);
      return;
    }
    if (this.artifactInfo.modelScheme?.domain) {
      this.artifactInfo.domainName = this.artifactInfo.modelScheme.domain;
      this.artifactInfo.domainPkgName = super.getDomainPkgName(this.artifactInfo.domainName);
      this.artifactInfo.pascalDomainName = pascalCase(this.artifactInfo.domainName);
      return;
    }
    const customChoice = 'RyCustomDomain';
    const baseArtifacts = [
      {name: `New Domain ${chalk.gray('(A custom domain)')}`, value: customChoice},
      {type: 'separator', line: '----- From Domain... -----'},
    ];

    if (this.shouldExit()) return;

    const availableDomains = [];
    let domainList = [];
    availableDomains.push(...baseArtifacts);
    try {
      domainList = await helpers.getDomainList(path.resolve(this.artifactInfo.rootDir, domainDir), 'domain');
      debug(`domain list ${domainList}`);

      if (domainList && domainList.length > 0) {
        availableDomains.push(...domainList);
        debug(`Available Domains: ${availableDomains}`);
      }
    } catch (err) {
      debug(`error ${err}`);
      return this.exit(err);
    }
    return this.prompt([
      {
        type: 'autocomplete',
        name: 'domainName',
        message: PROMPT_BASE_DOMAIN_CLASS,
        source: (answers, input) => helpers.fuzzySearch(answers, input, domainList, availableDomains),
        default: availableDomains[0],
        validate: utils.validateClassName,
      },
    ]).then(async props => {
      this.artifactInfo.isCustomDomain = true;
      if (props.domainName !== customChoice) {
        this.artifactInfo.isCustomDomain = false;
        this.artifactInfo.domainName = props.domainName;
        this.artifactInfo.domainPkgName = super.getDomainPkgName(this.artifactInfo.domainName);
        this.artifactInfo.pascalDomainName = pascalCase(this.artifactInfo.domainName);
      } else {
        await this.prompt([
          {
            type: 'input',
            name: 'domainName',
            message: g.f('New domain name:'),
            validate: utils.validateClassName,
          },
        ]).then(props => {
          this.artifactInfo.isCustomDomain = true;
          this.artifactInfo.domainName = props.domainName;
          this.artifactInfo.domainPkgName = super.getDomainPkgName(this.artifactInfo.domainName);
          this.artifactInfo.pascalDomainName = pascalCase(this.artifactInfo.domainName);
        });
      }
    });
  }

  generateNameCaseStyles(orgName) {
    this.artifactInfo.name = this.artifactInfo.name || orgName;
    const {pascal, pluralPascal, camel, pluralCamel, lower, alphanumericLower, sentence, snake, pluralSnake} =
      super.generateCaseStyles(this.artifactInfo.name);
    this.artifactInfo.className = helpers.toGolangClassName(this.artifactInfo.name); // Pascal case
    this.artifactInfo.lowercaseName = lower;
    this.artifactInfo.packageName = alphanumericLower;
    this.artifactInfo.pascalName = pascal;
    this.artifactInfo.camelName = camel;
    this.artifactInfo.pluralCamelName = pluralCamel;
    this.artifactInfo.snakeName = snake;
    this.artifactInfo.pluralSnakeName = pluralSnake;
    this.artifactInfo.pluralPascalName = pluralPascal;
    this.artifactInfo.pluralClassName = pluralize(this.artifactInfo.className);
    this.artifactInfo.sentenceName = sentence;
    this.artifactInfo.tableName = snakeCase(this.artifactInfo.pluralClassName);
  }

  async getModelScheme() {
    this.artifactInfo.modelScheme = undefined;
    if (!this.artifactInfo.modelBaseClass) {
      return;
    }
    const modelSchemeFileName = getModelSchemeFileName(this.artifactInfo.modelBaseClass);
    const filePath = path.resolve(this.destinationPath(), ryConfigDir, ryConfigModelDir, modelSchemeFileName);
    if (await fileExists(filePath)) {
      this.artifactInfo.modelScheme = require(filePath);
    }
  }

  async _replacePlaceholderToFiles(updatePath, tplPath, placeholder, skipReplace) {
    let tpl = await this.fs.read(tplPath, 'utf8');
    const newContent = this.fs._processTpl({
      contents: tpl,
      context: this.artifactInfo,
      filename: '',
      options: {},
    });
    try {
      await this.fs.copy(updatePath, updatePath, {
        process: content => {
          const replacer = new RegExp(placeholder, 'g');
          const contentStr = content.toString();
          if (skipReplace) {
            if (contentStr.includes(skipReplace)) {
              return contentStr;
            }
          }
          return contentStr.replace(replacer, newContent);
        },
      });
    } catch (e) {
      console.log(e);
    }
  }
};
