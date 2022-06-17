// Copyright IBM Corp. 2018,2020. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
'use strict';

const Generator = require('yeoman-generator');
const chalk = require('chalk');
const {readTextFromStdin, pluralize } = require('./utils');
const path = require('path');
const fs = require('fs');
const debug = require('./debug')('base-generator');
const g = require('./globalize');
const inquirerAutocomplete = require('inquirer-autocomplete-prompt');
const { ryConfigDir, ryConfigFileName, fileExists, configDir } = require('../generators/helpers');
const { generateDefaultConfigTemplate } = require('../generators/gen-config/templates/converter');
const utils = require('./utils');
const { pascalCase, camelCase, sentenceCase, snakeCase } = require('change-case');
const supportedPackageManagers = ['npm', 'yarn'];

debug('Is stdin interactive (isTTY)?', process.stdin.isTTY);

const DEFAULT_COPY_OPTIONS = {
  // See https://github.com/SBoudrias/mem-fs-editor/pull/147
  // Don't remove .ejs from the file name to keep backward-compatibility
  processDestinationPath: destPath => destPath,
  // See https://github.com/mrmlnc/fast-glob#options-1
  globOptions: {
    // Allow patterns to match filenames starting with a period (files &
    // directories), even if the pattern does not explicitly have a period
    // in that spot.
    dot: true,
    // Disable expansion of brace patterns ({a,b}, {1..3}).
    nobrace: true,
    // Disable extglob support (patterns like +(a|b)), so that extglobs
    // are regarded as literal characters. This flag allows us to support
    // Windows paths such as
    // `D:\Users\BKU\oliverkarst\AppData(Roaming)\npm\node_modules\@loopback\cli`
    noext: true,
  },
};

module.exports = class BaseGenerator extends Generator {
  // Note: arguments and options should be defined in the constructor.
  constructor(args, opts) {
    super(args, opts, {customInstallTask: true});
    this.env.adapter.promptModule.registerPrompt('autocomplete', inquirerAutocomplete)
    debug('Initializing generator', this.constructor.name);
    this._setupGenerator();
  }

  /**
   * Subclasses can extend _setupGenerator() to set up the generator
   */
  _setupGenerator() {
    debug('Setting up generator', this.constructor.name);
    // For the options coming from Yeoman,
    // overwrite the whole option object so that they can get translated.
    this._options['help'] = {
      name: 'help',
      type: Boolean,
      alias: 'h',
      description: g.f("Print the generator's options and usage"),
    };
    this._options['skip-cache'] = {
      name: 'skip-cache',
      type: Boolean,
      description: g.f('Do not remember prompt answers'),
      default: false,
    };
    this._options['ask-answered'] = {
      type: Boolean,
      description: g.f('Show prompts for already configured options'),
      default: false,
      name: 'ask-answered',
      hide: false,
    };
    debug(
      'Try overwrite yeoman messages globally',
      this._options['help'].description,
    );

    this.option('config', {
      type: String,
      alias: 'c',
      description: g.f('JSON file name or value to configure options'),
    });

    this.option('yes', {
      type: Boolean,
      alias: 'y',
      description: g.f(
        'Skip all confirmation prompts with default or provided value',
      ),
    });

    this.option('format', {
      type: Boolean,
      description: g.f('Format generated code using npm run lint:fix'),
    });

    this.option('packageManager', {
      type: String,
      description: g.f('Change the default package manager'),
      alias: 'pm',
    });


    this.artifactInfo = this.artifactInfo || {
      rootDir: 'src',
    };

    this.setConfigPath()
  }

  /**
   * Read a json document from stdin
   */
  async _readJSONFromStdin() {
    debug('Reading JSON from stdin');
    if (process.stdin.isTTY) {
      this.log(
        chalk.green(
          'Please type in a json object line by line ' +
            '(Press <ctrl>-D or type EOF to end):',
        ),
      );
    }

    let jsonStr;
    try {
      jsonStr = await readTextFromStdin();
      debug(
        'Result:',
        jsonStr === undefined ? '(undefined)' : JSON.stringify(jsonStr),
      );
      return JSON.parse(jsonStr);
    } catch (e) {
      if (!process.stdin.isTTY) {
        debug(e, jsonStr);
      }
      throw e;
    }
  }

  async setOptions() {
    let opts = {};
    const jsonFileOrValue = this.options.config;
    debug(
      'Loading generator options from CLI args and/or stdin.',
      ...(this.option.config === undefined
        ? ['(No config was provided.)']
        : ['Config:', this.options.config]),
    );
    try {
      if (
        jsonFileOrValue === 'stdin' ||
        (!jsonFileOrValue && !process.stdin.isTTY)
      ) {
        debug('  enabling --yes and reading config from stdin');
        this.options['yes'] = true;
        opts = await this._readJSONFromStdin();
      } else if (typeof jsonFileOrValue === 'string') {
        const jsonFile = path.resolve(process.cwd(), jsonFileOrValue);
        if (fs.existsSync(jsonFile)) {
          debug('  reading config from file', jsonFile);
          opts = this.fs.readJSON(jsonFile);
        } else {
          debug('  parsing config from string', jsonFileOrValue);
          // Try parse the config as stringified json
          opts = JSON.parse(jsonFileOrValue);
        }
      }
    } catch (e) {
      this.exit(e);
      return;
    }
    if (typeof opts !== 'object') {
      this.exit('Invalid config file or value: ' + jsonFileOrValue);
      return;
    }
    for (const o in opts) {
      if (this.options[o] == null) {
        this.options[o] = opts[o];
      }
    }

    const packageManager =
      this.options.packageManager || this.config.get('packageManager') || 'npm';
    if (!supportedPackageManagers.includes(packageManager)) {
      const supported = supportedPackageManagers.join(' or ');
      this.exit(
        `Package manager '${packageManager}' is not supported. Use ${supported}.`,
      );
    }
  }

  /**
   * Check if a question can be skipped in `express` mode
   * @param {object} question A yeoman prompt
   */
  _isQuestionOptional(question) {
    return (
      question.default != null || // Having a default value
      this.options[question.name] != null || // Configured in options
      question.type === 'list' || // A list
      question.type === 'rawList' || // A raw list
      question.type === 'checkbox' || // A checkbox
      question.type === 'confirm'
    ); // A confirmation
  }

  /**
   * Get the default answer for a question
   * @param {*} question
   */
  async _getDefaultAnswer(question, answers) {
    // First check existing answers
    let defaultVal = answers[question.name];
    if (defaultVal != null) return defaultVal;

    // Now check the `default` of the prompt
    let def = question.default;
    if (typeof question.default === 'function') {
      def = await question.default(answers);
    }
    defaultVal = def;

    if (question.type === 'confirm') {
      return defaultVal != null ? defaultVal : true;
    }
    if (question.type === 'list' || question.type === 'rawList') {
      // Default to 1st item
      if (def == null) def = 0;
      if (typeof def === 'number') {
        // The `default` is an index
        const choice = question.choices[def];
        if (choice) {
          defaultVal = choice.value || choice.name;
        }
      } else {
        // The default is a value
        if (question.choices.map(c => c.value || c.name).includes(def)) {
          defaultVal = def;
        }
      }
    } else if (question.type === 'checkbox') {
      if (def == null) {
        defaultVal = question.choices
          .filter(c => c.checked && !c.disabled)
          .map(c => c.value || c.name);
      } else {
        defaultVal = def
          .map(d => {
            if (typeof d === 'number') {
              const choice = question.choices[d];
              if (choice && !choice.disabled) {
                return choice.value || choice.name;
              }
            } else {
              if (
                question.choices.find(
                  c => !c.disabled && d === (c.value || c.name),
                )
              ) {
                return d;
              }
            }
            return undefined;
          })
          .filter(v => v != null);
      }
    }
    return defaultVal;
  }

  /**
   * Override the base prompt to skip prompts with default answers
   * @param questions - One or more questions
   */
  async prompt(questions) {
    // Normalize the questions to be an array
    if (!Array.isArray(questions)) {
      questions = [questions];
    }
    if (!this.options['yes']) {
      if (!process.stdin.isTTY) {
        const msg =
          'The stdin is not a terminal. No prompt is allowed. ' +
          'Use --config to provide answers to required prompts and ' +
          '--yes to skip optional prompts with default answers';
        this.log(chalk.red(msg));
        this.exit(new Error(msg));
        return;
      }
      // Non-express mode, continue to prompt
      debug('Questions', questions);
      const answers = await super.prompt(questions);
      debug('Answers', answers);
      return answers;
    }

    const answers = Object.assign({}, this.options);

    for (const q of questions) {
      let when = q.when;
      if (typeof when === 'function') {
        when = await q.when(answers);
      }
      if (when === false) continue;
      if (this._isQuestionOptional(q)) {
        const answer = await this._getDefaultAnswer(q, answers);
        debug('%s: %j', q.name, answer);
        answers[q.name] = answer;
      } else {
        if (!process.stdin.isTTY) {
          const msg =
            'The stdin is not a terminal. No prompt is allowed. ' +
            `(While resolving a required prompt ${JSON.stringify(q.name)}.)`;
          this.log(chalk.red(msg));
          this.exit(new Error(msg));
          return;
        }
        // Only prompt for non-skipped questions
        const props = await super.prompt([q]);
        Object.assign(answers, props);
      }
    }
    return answers;
  }

  /**
   * Override the usage text by replacing `yo loopback4:` with `lb4 `.
   */
  usage() {
    const text = super.usage();
    return text.replace(/^yo loopback4:/g, 'lb4 ');
  }

  /**
   * Tell this generator to exit with the given reason
   * @param {string|Error} reason
   */
  exit(reason) {
    // exit(false) should not exit
    if (reason === false) return;
    // exit(), exit(undefined), exit('') should exit
    if (!reason) reason = true;
    this.exitGeneration = reason;
  }

  /**
   * Wrapper for mem-fs-editor.copyTpl() to ensure consistent options
   *
   * See https://github.com/SBoudrias/mem-fs-editor/blob/master/lib/actions/copy-tpl.js
   *
   * @param {string} from
   * @param {string} to
   * @param {object} context
   * @param {object} templateOptions
   * @param {object} copyOptions
   */
  copyTemplatedFiles(
    from,
    to,
    context,
    templateOptions = {},
    copyOptions = DEFAULT_COPY_OPTIONS,
  ) {
    return this.fs.copyTpl(from, to, context, templateOptions, copyOptions);
  }

  _runNpmScript(projectDir, args) {
    return new Promise((resolve, reject) => {
      this.spawnCommand('npm', args, {
        // Disable stdout
        stdio: [process.stdin, 'ignore', process.stderr],
        cwd: projectDir,
      }).on('close', code => {
        if (code === 0) resolve();
        else reject(new Error('npm exit code: ' + code));
      });
    });
  }

  /**
   * Check if the generator should exit
   */
  shouldExit() {
    return !!this.exitGeneration;
  }

  async _runLintFix() {
    if (this.options.format) {
      const pkg = this.packageJson || {};
      if (pkg.scripts && pkg.scripts['lint:fix']) {
        this.log(g.f("Running 'npm run lint:fix' to format the code..."));
        await this._runNpmScript(this.destinationRoot(), [
          'run',
          '-s',
          'lint:fix',
        ]);
      } else {
        this.log(
          chalk.red(g.f("No 'lint:fix' script is configured in package.json.")),
        );
      }
    }
  }

  setConfigPath (subConfigPath = '') {
    this.artifactInfo.configOutDir = path.resolve(
      this.destinationPath(),
      subConfigPath,
      ryConfigDir,
    );

    this.artifactInfo.configOutFilePath = this.destinationPath(
      this.artifactInfo.configOutDir,
      ryConfigFileName
    );
  }

  async getAppConfig(subConfigPath) {
    if (subConfigPath || !this.artifactInfo.configOutFilePath) {
      this.setConfigPath(subConfigPath)
    }

    let config
    const ryConfigFilePath = path.resolve(this.artifactInfo.configOutFilePath)
    if (await fileExists(ryConfigFilePath)) {
      config = require(ryConfigFilePath)
      if (config.appModName) {
        this.artifactInfo.appModName = config.appModName
        return
      }
    }
    await this.promptAppModName(config)

  }

  async promptAppModName(config) {
    debug('Prompting for app mod name');
    if (this.shouldExit()) return false;
    if (!config) {
      config = generateDefaultConfigTemplate()
    }
    const prompts = [
      {
        type: 'input',
        name: 'appModName',
        message: 'Please specify your application module name',
        validate: utils.validateGoPackageName,
        default: this.projectInfo?.name && this.projectInfo?.name?.toLowerCase()?.replace(/_|\s|-/g, '')
      }
    ];

    await this.prompt(prompts).then(props => {
      Object.assign(this.artifactInfo, props);
      config = {...config, appModName: props.appModName}
      this.copyTemplatedFiles(
        path.resolve(__dirname, `../generators/${configDir}/templates/config.js.ejs`),
        this.artifactInfo.configOutFilePath,
        config
      );
      return props;
    });
  }

  /**
   * Print out the exit reason if this generator is told to exit before it ends
   */
  async end() {
    if (this.shouldExit()) {
      debug(this.exitGeneration);
      this.log(
        chalk.red(g.f('Generation is aborted: %s', this.exitGeneration)),
      );
      // Fail the process
      process.exitCode = 1;
      return;
    }
    await this._runLintFix();
  }

  // Check all files being generated to ensure they succeeded
  _isGenerationSuccessful() {
    return true;
  }

  getDomainPkgName(orgName) {
    const lower = orgName.toLowerCase()
    return lower.replace(/[\W_]+/g, '')
  }

  generateCaseStyles(orgName) {
    const pascal = pascalCase(orgName)
    const pluralPascal = pluralize(pascal)
    const camel = camelCase(orgName)
    const pluralCamel = pluralize(camel)
    const snake = snakeCase(pascal)
    const pluralSnake = pluralize(snake)
    const lower = pascal.toLowerCase()
    const pluralLower = pluralize(lower)
    const alphanumericLower = lower.replace(/[\W_]+/g, '')
    const pluralAlphanumericLower = pluralize(alphanumericLower)
    const sentence = sentenceCase(camel)
    const pluralSentence = pluralize(sentence)

    return {
      pascal,
      pluralPascal,
      camel,
      pluralCamel,
      snake,
      pluralSnake,
      lower,
      pluralLower,
      alphanumericLower,
      pluralAlphanumericLower,
      sentence,
      pluralSentence
    }
  }

};
