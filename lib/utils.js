// Copyright IBM Corp. 2017,2020. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const chalk = require('chalk');
const debug = require('../lib/debug')('utils');
const fs = require('fs');
const path = require('path');
const util = require('util');
const stream = require('stream');
const {spawnSync} = require('child_process');
const readline = require('readline');
const semver = require('semver');
const regenerate = require('regenerate');
const _ = require('lodash');
const pascalCase = require('change-case').pascalCase;
const promisify = require('util').promisify;
const toVarName = require('change-case').camelCase;
const pluralize = require('pluralize');
const urlSlug = require('url-slug');
const validate = require('validate-npm-package-name');
const stringifyObject = require('stringify-object');
const camelCase = _.camelCase;
const kebabCase = _.kebabCase;
const readdirAsync = promisify(fs.readdir);
const toFileName = name => {
  return kebabCase(name).replace(/\-(\d+)$/g, '$1');
};

const RESERVED_PROPERTY_NAMES = ['constructor'];

/**
 * Either a reference to util.promisify or its polyfill, depending on
 * your version of Node.
 */
exports.promisify = promisify;

/**
 * Returns a valid variable name regex;
 * taken from https://gist.github.com/mathiasbynens/6334847
 */
function generateValidRegex() {
  const get = function (what) {
    return require('unicode-10.0.0/' + what + '/code-points.js');
  };
  const idStart = get('Binary_Property/ID_Start');
  const idContinue = get('Binary_Property/ID_Continue');
  const compileRegex = _.template(
    '^(?:<%= identifierStart %>)(?:<%= identifierPart %>)*$',
  );
  const identifierStart = regenerate(idStart).add('$', '_');
  const identifierPart = regenerate(idContinue).add(
    '$',
    '_',
    '\u200C',
    '\u200D',
  );
  const regex = compileRegex({
    identifierStart: identifierStart.toString(),
    identifierPart: identifierPart.toString(),
  });
  return new RegExp(regex);
}
const validRegex = generateValidRegex();
exports.validRegex = validRegex;

/**
 * validate application (module) name
 * @param name
 * @returns {String|Boolean}
 */
exports.validateClassName = function (name) {
  if (typeof name === 'object') {
    name = name.value
  }
  if (!name || name === '') {
    return 'Class name cannot be empty';
  }
  if (name.match(validRegex)) {
    return true;
  }
  if (!isNaN(name.charAt(0))) {
    return util.format('Class name cannot start with a number: %s', name);
  }
  if (name.includes('.')) {
    return util.format('Class name cannot contain .: %s', name);
  }
  if (name.includes(' ')) {
    return util.format('Class name cannot contain spaces: %s', name);
  }
  if (name.includes('-')) {
    return util.format('Class name cannot contain hyphens: %s', name);
  }
  if (name.match(/[\/@\s\+%:]/)) {
    return util.format(
      'Class name cannot contain special characters (/@+%: ): %s',
      name,
    );
  }
  return util.format('Class name is invalid: %s', name);
};

exports.validateGoPackageName = function (name) {
  if (typeof name === 'object') {
    name = name.value
  }
  if (!name || name === '') {
    return 'Package name cannot be empty';
  }
  if (!isNaN(name.charAt(0))) {
    return util.format('Package name cannot start with a number: %s', name);
  }
  if (name.includes('.')) {
    return util.format('Package name cannot contain .: %s', name);
  }
  if (name.includes(' ')) {
    return util.format('Package name cannot contain spaces: %s', name);
  }
  if (name.includes('_')) {
    return util.format('Package name cannot contain underscore: %s', name);
  }
  if (name.match(/[\/@\s\+%:]/)) {
    return util.format(
      'Package name cannot contain special characters (/@+%: ): %s',
      name,
    );
  }

  if (name !== name.toLowerCase()) {
    return util.format(
      'Package name cannot contain any uppercase (capital) letters: %s',
      name,
    );
  }
  if (name.match(validRegex)) {
    return true;
  }
  return util.format('Package name is invalid: %s', name);
};

exports.logNamingIssues = function (name, log) {
  if (name.includes('_')) {
    log(
      chalk.red('>>> ') +
        `Underscores _ in the class name will get removed: ${name}`,
    );
  }
  if (name.match(/[\u00C0-\u024F\u1E00-\u1EFF]/)) {
    log(
      chalk.red('>>> ') +
        `Accented chars in the class name will get replaced: ${name}`,
    );
  }
};

exports.logClassCreation = function (type, typePlural, name, log) {
  log(
    `${exports.toClassName(type)} ${chalk.yellow(
      name,
    )} will be created in src/${typePlural}/${chalk.yellow(
      exports.toFileName(name) + '.' + `${type}.ts`,
    )}`,
  );
  log();
};

/**
 * Validate project directory to not exist
 */
exports.validateNotExisting = function (projDir) {
  if (fs.existsSync(projDir)) {
    return util.format('Directory %s already exists.', projDir);
  }
  return true;
};

/**
 * validate source key or foreign key for relations
 */
/* istanbul ignore next */
exports.validateKeyName = function (name) {
  if (!name || name === '') {
    return 'Key name cannot be empty';
  }
  if (!isNaN(name.charAt(0))) {
    return util.format('Key name cannot start with a number: %s', name);
  }
  if (name.includes('.')) {
    return util.format('Key name cannot contain .: %s', name);
  }
  if (name.includes(' ')) {
    return util.format('Key name cannot contain spaces: %s', name);
  }
  if (name.includes('-')) {
    return util.format('Key name cannot contain hyphens: %s', name);
  }
  if (name.match(/[\/@\s\+%:]/)) {
    return util.format(
      'Key name cannot contain special characters (/@+%: ): %s',
      name,
    );
  }
  return true;
};

/**
 * validate if the input name is valid. The input name cannot be the same as
 * comparedTo.
 */
/* istanbul ignore next */
exports.validateKeyToKeyFrom = function (input, comparedTo) {
  if (!input || input === '') {
    return 'Key name cannot be empty';
  }
  if (input === comparedTo) {
    return util.format(
      'Through model cannot have two identical foreign keys: %s',
      input,
    );
  }
  if (!isNaN(input.charAt(0))) {
    return util.format('Key name cannot start with a number: %s', input);
  }
  if (input.includes('.')) {
    return util.format('Key name cannot contain .: %s', input);
  }
  if (input.includes(' ')) {
    return util.format('Key name cannot contain spaces: %s', input);
  }
  if (input.includes('-')) {
    return util.format('Key name cannot contain hyphens: %s', input);
  }
  if (input.match(/[\/@\s\+%:]/)) {
    return util.format(
      'Key name cannot contain special characters (/@+%: ): %s',
      input,
    );
  }
  return true;
};

/**
 * checks if the belongsTo relation has the same relation name and source key name,
 * which is an invalid case.
 */
/* istanbul ignore next */
exports.validateRelationName = function (name, type, foreignKeyName) {
  if (!name || name === '') {
    return 'Relation name cannot be empty';
  }
  if (type === 'belongsTo' && name === foreignKeyName) {
    return util.format(
      'Relation name cannot be the same as the source key name: %s',
      name,
    );
  }
  if (!isNaN(name.charAt(0))) {
    return util.format('Relation name cannot start with a number: %s', name);
  }
  if (name.includes('.')) {
    return util.format('Relation name cannot contain .: %s', name);
  }
  if (name.includes(' ')) {
    return util.format('Relation name cannot contain spaces: %s', name);
  }
  if (name.includes('-')) {
    return util.format('Relation name cannot contain hyphens: %s', name);
  }
  if (name.match(/[\/@\s\+%:]/)) {
    return util.format(
      'Relation name cannot contain special characters (/@+%: ): %s',
      name,
    );
  }
  return true;
};

/**
 * Converts a name to class name after validation
 */
exports.toClassName = function (name) {
  if (name === '') return new Error('no input');
  if (typeof name != 'string' || name == null) return new Error('bad input');
  return pascalCase(camelCase(name));
};

exports.toFileName = toFileName;
exports.pascalCase = pascalCase;
exports.camelCase = camelCase;
exports.toVarName = toVarName;
exports.pluralize = pluralize;
exports.urlSlug = urlSlug;

exports.validate = function (name) {
  const isValid = validate(name).validForNewPackages;
  if (!isValid) return 'Invalid npm package name: ' + name;
  return isValid;
};

/**
 * Adds a backslash to the start of the word if not already present
 * @param {string} httpPath
 */
exports.prependBackslash = httpPath => httpPath.replace(/^\/?/, '/');

/**
 * Validates whether a given string is a valid url slug or not.
 * Allows slugs with backslash in front of them to be validated as well
 * @param {string} name Slug to validate
 */
exports.validateUrlSlug = function (name) {
  const backslashIfNeeded = name.charAt(0) === '/' ? '/' : '';
  if (backslashIfNeeded === '/') {
    name = name.substr(1);
  }
  const separators = ['-', '.', '_', '~', ''];
  const possibleSlugs = separators.map(separator =>
    urlSlug(name, {
      separator,
      transformer: false,
    }),
  );
  if (!possibleSlugs.includes(name))
    return `Invalid url slug. Suggested slug: ${backslashIfNeeded}${possibleSlugs[0]}`;
  return true;
};

/**
 * Find all artifacts in the given path whose type matches the provided
 * filetype.
 * For example, a fileType of "model" will search the target path for matches to
 * "*.model.js"
 * @param {string} path The directory path to search. This search is *not*
 * recursive.
 * @param {string} artifactType The type of the artifact in string form.
 * @param {Function=} reader An optional reader function to retrieve the
 * paths. Must return a Promise.
 * @returns {Promise<string[]>} The filtered list of paths.
 */
exports.findArtifactPaths = async function (dir, artifactType, reader) {
  const readdir = reader || readdirAsync;
  debug('Finding %j artifact paths at %s', artifactType, dir);

  try {
    // Wrapping readdir in case it's not a promise.
    const files = await readdir(dir);
    return files.filter(
      f =>
        _.endsWith(f, `${artifactType}.js`) ||
        _.endsWith(f, `${artifactType}.ts`),
    );
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Target directory was not found (e.g. "src/models" does not exist yet).
      return [];
    }
    throw err;
  }
};
/**
 * Parses the files of the target directory and returns matching JavaScript
 * or TypeScript artifact files. NOTE: This function does not examine the
 * contents of these files!
 * @param {string} dir The target directory from which to load artifacts.
 * @param {string} artifactType The artifact type (ex. "model", "repository")
 * @param {boolean} addSuffix Whether or not to append the artifact type to the
 * results. (ex. [Foo,Bar] -> [FooRepository, BarRepository])
 * @param {Function} reader An alternate function to replace the promisified
 * fs.readdir (useful for testing and for custom overrides).
 */
exports.getArtifactList = async function (
  dir,
  artifactType,
  addSuffix,
  reader,
) {
  const paths = await exports.findArtifactPaths(dir, artifactType, reader);
  debug('Artifacts paths found:', paths);
  return paths.map(p => {
    const firstWord = _.first(_.split(_.last(_.split(p, path.sep)), '.'));
    const result = pascalCase(exports.toClassName(firstWord));
    return addSuffix
      ? exports.toClassName(result) + exports.toClassName(artifactType)
      : exports.toClassName(result);
  });
};

/**
 * Check package.json and dependencies.json to find out versions for generated
 * dependencies
 */
exports.getDependencies = function () {
  const pkg = require('../package.json');
  let version = pkg.version;
  // First look for config.loopbackVersion
  if (pkg.config && pkg.config.loopbackVersion) {
    version = pkg.config.loopbackVersion;
  }
  // Set it to be `^x.y.0`
  const loopbackVersion =
    '^' + semver.major(version) + '.' + semver.minor(version) + '.0';

  const deps = {};
  const dependencies = (pkg.config && pkg.config.templateDependencies) || {};
  for (const i in dependencies) {
    // Default to loopback version if the version for a given dependency is ""
    deps[i] = dependencies[i] || loopbackVersion;
  }
  return deps;
};

/**
 * Rename EJS files
 */
exports.renameEJS = function () {
  const renameStream = new stream.Transform({objectMode: true});

  renameStream._transform = function (file, enc, callback) {
    const filePath = file.relative;
    const dirname = path.dirname(filePath);
    let extname = path.extname(filePath);
    let basename = path.basename(filePath, extname);

    // extname already contains a leading '.'
    const fileName = `${basename}${extname}`;
    const result = fileName.match(/(.+)(.ts|.tsx|.json|.js|.md|.html|.go|.mod|.yml)\.ejs$/);
    if (result) {
      extname = result[2];
      basename = result[1];
      file.path = path.join(file.base, dirname, basename + extname);
    }
    callback(null, file);
  };

  return renameStream;
};

/**
 * Get a validate function for object/array type
 * @param {String} type 'object' OR 'array'
 */
exports.validateStringObject = function (type) {
  return function validateStringified(val) {
    if (val === null || val === '') {
      return true;
    }

    const err = `The value must be a stringified ${type}`;

    if (typeof val !== 'string') {
      return err;
    }

    try {
      const result = JSON.parse(val);
      if (type === 'array' && !Array.isArray(result)) {
        return err;
      }
    } catch (e) {
      return err;
    }

    return true;
  };
};

/**
 * Use readline to read text from stdin
 */
exports.readTextFromStdin = function () {
  const rl = readline.createInterface({
    input: process.stdin,
  });

  const lines = [];
  let err;
  return new Promise((resolve, reject) => {
    rl.on('SIGINT', () => {
      err = new Error('Canceled by user');
      rl.close();
    })
      .on('line', line => {
        if (line === 'EOF') {
          rl.close();
        } else {
          lines.push(line);
        }
      })
      .on('close', () => {
        if (err) reject(err);
        else resolve(lines.join('\n'));
      })
      .on('error', e => {
        err = e;
        rl.close();
      });
  });
};

/*
 * Validate property name
 * @param {String} name The user input
 * @returns {String|Boolean}
 */
exports.checkPropertyName = function (name) {
  const result = exports.validateRequiredName(name);
  if (result !== true) return result;
  if (RESERVED_PROPERTY_NAMES.includes(name)) {
    return `${name} is a reserved keyword. Please use another name`;
  }
  return true;
};

/**
 * Validate required name for properties, data sources, or connectors
 * Empty name could not pass
 * @param {String} name The user input
 * @returns {String|Boolean}
 */
exports.validateRequiredName = function (name) {
  if (!name) {
    return 'Name is required';
  }
  return validateValue(name, /[\/@\s\+%:\.]/);
};

function validateValue(name, unallowedCharacters) {
  if (!unallowedCharacters) {
    unallowedCharacters = /[\/@\s\+%:\.]/;
  }
  if (name.match(unallowedCharacters)) {
    return `Name cannot contain special characters ${unallowedCharacters}: ${name}`;
  }
  if (name !== encodeURIComponent(name)) {
    return `Name cannot contain special characters escaped by encodeURIComponent: ${name}`;
  }
  return true;
}
/**
 *  Returns the modelName in the directory file format for the model
 * @param {string} modelName
 */
exports.getModelFileName = function (modelName) {
  return `${toFileName(modelName)}.model.ts`;
};

/**
 * Returns the repositoryName in the directory file format for the repository
 * @param {string} repositoryName
 */
exports.getRepositoryFileName = function (repositoryName) {
  return `${toFileName(repositoryName)}.repository.ts`;
};

/**
 * Returns the rest-config in the directory file format for the model endpoint
 * @param {string} modelName
 */
exports.getRestConfigFileName = function (modelName) {
  return `${toFileName(modelName)}.rest-config.ts`;
};

/**
 * Returns the serviceName in the directory file format for the service
 * @param {string} serviceName
 */
exports.getServiceFileName = function (serviceName) {
  return `${toFileName(serviceName)}.service.ts`;
};

/**
 * Returns the observerName in the directory file format for the observer
 * @param {string} observerName
 */
exports.getObserverFileName = function (observerName) {
  return `${toFileName(observerName)}.observer.ts`;
};

/**
 * Returns the interceptorName in the directory file format for the interceptor
 * @param {string} interceptorName
 */
exports.getInterceptorFileName = function (interceptorName) {
  return `${toFileName(interceptorName)}.interceptor.ts`;
};

exports.stringifyObject = function (data, options = {}) {
  return stringifyObject(data, {
    indent: '  ', // two spaces
    singleQuotes: true,
    inlineCharacterLimit: 80,
    ...options,
  });
};

exports.stringifyModelSettings = function (modelSettings) {
  if (!modelSettings || !Object.keys(modelSettings).length) return '';
  return exports.stringifyObject({settings: modelSettings});
};

/**
 * Wrap a single line
 * @param {string} line Text for the a line
 * @param {number} maxLineLength - Maximum line length before wrapping
 */
function wrapLine(line, maxLineLength) {
  if (line === '') return line;
  let lineLength = 0;
  const words = line.split(/\s+/g);
  return words.reduce((result, word) => {
    if (lineLength + word.length >= maxLineLength) {
      lineLength = word.length;
      return `${result}\n${word}`;
    } else {
      lineLength += word.length + (result ? 1 : 0);
      return result ? `${result} ${word}` : `${word}`;
    }
  }, '');
}

/**
 * Wrap the text into lines respecting the max line length
 * @param {string} text - Text string
 * @param {number} maxLineLength - Maximum line length before wrapping
 */
function wrapText(text, maxLineLength = 80) {
  let lines = text.split('\n');
  lines = lines.map(line => wrapLine(line, maxLineLength));
  return lines.join('\n');
}

exports.wrapLine = wrapLine;
exports.wrapText = wrapText;

/**
 * Check if `yarn` is installed
 */
let yarnInstalled = undefined;
function isYarnAvailable() {
  if (yarnInstalled == null) {
    yarnInstalled = spawnSync('yarn', ['help'], {stdio: false}).status === 0;
  }
  return yarnInstalled;
}
exports.isYarnAvailable = isYarnAvailable;
