/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

const _ = require('lodash');
const path = require('path');
const {pascalCase, camelCase, paramCase} = require('change-case');
const {promisify} = require('util');
const fs = require('fs');
const snakeCase = require('change-case').snakeCase;
const readdirAsync = promisify(fs.readdir);
const debug = require('../lib/debug')('helpers');
const fuzzy = require('fuzzy');

exports.sourceRootDir = 'app';
exports.databaseDir = `database`;
exports.databaseRootDir = `${exports.sourceRootDir}/${exports.databaseDir}`;
exports.ryConfigDir = 'ry-gen-config';
exports.ryConfigModelDir = 'models';
exports.ryConfigFileName = 'index.js';
exports.configDir = 'gen-config';
exports.modelDir = 'model';
exports.foundationDir = 'foundation';
exports.foundationCtnCtlFile = `${exports.sourceRootDir}/foundation/controller/container/container_controller.go`;
exports.foundationCtnRepoFile = `${exports.sourceRootDir}/foundation/repo/container/container_repo.go`;
exports.foundationCtnSvcFile = `${exports.sourceRootDir}/foundation/service/container/container_service.go`;
exports.diDir = 'di';
exports.diRegDir = 'registrator';
exports.diRegCtlFile = 'controllers.go';
exports.diRegSvcFile = 'services.go';
exports.diRegRepoFile = 'repositories.go';
exports.domainDir = 'domain';
exports.transformerDir = 'tfm';
exports.controllerDir = 'controller';
exports.requestDir = 'request';
exports.repositoryDir = 'repo';
exports.gormDir = 'gorm';
exports.routeDir = 'route';
exports.serviceDir = 'service';
exports.migrationDir = 'migration';
exports.sourceDomainDir = `${exports.sourceRootDir}/${exports.domainDir}`;

exports.placeholderPrefix = 'ry_placeholder';
exports.getPlaceholder = function (type, isCommentedCode = true) {
  return isCommentedCode ? `// {{${exports.placeholderPrefix}:${type}}}` : `{{${exports.placeholderPrefix}:${type}}}`;
};

exports.newPropsPlaceholder = exports.getPlaceholder('new_props');
exports.newMigrationPlaceholder = exports.getPlaceholder('migration_new');
exports.newCtlPlaceholder = exports.getPlaceholder('ctl_new');
exports.newCtlImportPlaceholder = exports.getPlaceholder('ctl_import');
exports.newSvcPlaceholder = exports.getPlaceholder('svc_new');
exports.newSvcImportPlaceholder = exports.getPlaceholder('svc_import');
exports.newRepoPlaceholder = exports.getPlaceholder('repo_new');
exports.newRepoImportPlaceholder = exports.getPlaceholder('repo_import');
exports.newGormImportPlaceholder = exports.getPlaceholder('gorm_import');
exports.newRepoBindPlaceholder = exports.getPlaceholder('repo_bind');
exports.newRoutePlaceholder = exports.getPlaceholder('new_route_resources');
exports.newRouteImportPlaceholder = exports.getPlaceholder('new_route_resources_import');

exports.golangTypeChoices = ['string', 'text', 'uuid', 'bool', 'int', 'int64', 'time.Time', 'datatypes.JSON', 'array'];
exports.golangArrayTypeChoices = ['string', 'uuid', 'bool', 'int', 'int64']

exports.dbFilterChoices = ['=', 'ilike', 'like', 'range'];
exports.packageList = {
  'time.Time': 'time',
  '*time.Time': 'time',
  'datatypes.JSON': 'gorm.io/datatypes',
  '*datatypes.JSON': 'gorm.io/datatypes',
  'pq.Int64Array': 'github.com/lib/pq',
  '*pq.Int64Array': 'github.com/lib/pq',
  'pq.Int32Array': 'github.com/lib/pq',
  '*pq.Int32Array': 'github.com/lib/pq',
  'pq.StringArray': 'github.com/lib/pq',
  '*pq.StringArray': 'github.com/lib/pq',
}
exports.getListPackage = function () {
  return _.cloneDeep(exports.packageList);
};

exports.importPackage = props => {
  let packages = []
  props.forEach((prop) => {
    let package = _.get(exports.packageList, prop.goType, null)
    if (package && !packages.includes(package)) {
      // packages.push(`"${package}"`)
      packages.push(package)
    }
  })
  return packages
}

exports.filterModelType = prop => {
  switch (prop.goType) {
    case '[]int':
      return 'pq.Int32Array';
    case '[]*int':
      return '*pq.Int32Array';
    case '[]int64':
      return 'pq.Int64Array';
    case '[]*int64':
      return '*pq.Int64Array';
    case '[]string':
      return 'pq.StringArray';
    case '[]*string':
      return '*pq.StringArray';
    case 'text':
      return 'string';
    case '*text':
      return '*string';
    default:
      return prop.goType;
  }
}
exports.filterGormTag = prop => {
  switch (prop.goType) {
    case 'pq.Int32Array':
    case '*pq.Int32Array':
      return 'pq:Int32Array';
    case 'pq.Int64Array':
    case '*pq.Int64Array':
      return 'pq.Int64Array';
    case 'pq.StringArray':
    case '*pq.StringArray':
      return 'type:varchar(1000)[]';
    default:
      return null;
  }
}
exports.filterGormType = prop => {
  let gormType = exports.getGormType(prop.orgType)
  if (prop.type == 'array') {
    return `${gormType}[]`
  }
  return gormType
}
exports.getGormType = golangType => {
  const orgType = golangType.replace(/\*/g, '');
  switch (orgType) {
    case 'string':
      return 'varchar(1000)';
    case 'text':
      return 'text';
    case 'bool':
      return 'boolean';
    case 'time.Time':
      return 'timestamp with time zone';
    case 'int':
      return 'integer';
    case 'int64':
      return 'bigint';
    case 'datatypes.JSON':
      return 'jsonb';
    default:
      return 'varchar(1000)';
  }
};

const toFileName = name => {
  return snakeCase(name).replace(/\-(\d+)$/g, '$1');
};

exports.getModelFileName = function (modelName) {
  return `${toFileName(modelName)}.go`;
};
exports.getModelSchemeFileName = function (modelName) {
  return `${paramCase(toFileName(modelName))}.js`;
};

exports.getTransformerFileName = function (className) {
  return `${toFileName(className)}.go`;
};

exports.getRouteFileName = function () {
  return `v1.go`;
};

exports.getControllerFileName = function (className) {
  return `${toFileName(className)}.go`;
};

exports.getRequestFileName = function (className) {
  return `${toFileName(className)}.go`;
};

exports.getRepositoryFileName = function (className) {
  return `${toFileName(className)}.go`;
};

exports.getServiceFileName = function (className) {
  return `${toFileName(className)}.go`;
};

exports.getMigrationFileName = function (migrationID) {
  return `${toFileName(migrationID)}.go`;
};

exports.findArtifactPaths = async function (dir, artifactType, reader) {
  const readdir = reader || readdirAsync;
  debug('Finding %j artifact paths at %s', artifactType, dir);

  try {
    // Wrapping readdir in case it's not a promise.
    const files = await readdir(dir);
    return files.filter(f => f !== 'base.go');
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Target directory was not found (e.g. "app/models" does not exist yet).
      return [];
    }
    throw err;
  }
};

exports.fileExists = async path => !!(await fs.promises.stat(path).catch(() => false));

exports.getDomainList = async function (dir, artifactType, addSuffix, reader) {
  const paths = await exports.findArtifactPaths(dir, artifactType, reader);
  debug('Artifacts paths found:', paths);
  return paths;
};

exports.getArtifactList = async function (dir, artifactType, addSuffix, reader) {
  const paths = await exports.findArtifactPaths(dir, artifactType, reader);
  debug('Artifacts paths found:', paths);
  return paths.map(p => {
    const firstWord = _.first(_.split(_.last(_.split(p, path.sep)), '.'));
    const result = pascalCase(exports.toGolangClassName(firstWord));
    return addSuffix
      ? exports.toGolangClassName(result) + exports.toGolangClassName(artifactType)
      : exports.toGolangClassName(result);
  });
};

exports.toGolangClassName = function (name) {
  if (name === '') return new Error('no input');
  if (typeof name != 'string' || name == null) return new Error('bad input');
  return pascalCase(camelCase(name));
};

exports.fuzzySearch = function (answers, input, data, allChoices) {
  input = input || '';

  return new Promise(function (resolve) {
    if (!input) {
      resolve(allChoices || data);
    }
    setTimeout(function () {
      const fuzzyResult = fuzzy.filter(input, data);
      resolve(
        fuzzyResult.map(function (el) {
          return el.original;
        }),
      );
    }, 50);
  });
};

exports.format2Digit = value => {
  if (!value || value.toString().length >= 2) {
    return value;
  }
  return `0${value}`;
};
