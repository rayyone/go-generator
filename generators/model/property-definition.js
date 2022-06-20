/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

'use strict';

const pascalCase = require('change-case').pascalCase;

const GO_BUILTIN_TYPES = ['string', 'bool', 'int', 'int64', 'time.Time', 'postgres.Jsonb', 'array'];
const NON_GO_TYPES = ['uuid'];
const BUILTIN_TYPES = [...GO_BUILTIN_TYPES, ...NON_GO_TYPES];

module.exports = {
  createPropertyTemplateData,
  findBuiltinType,
  BUILTIN_TYPES,
};

/**
 * Convert property definition to data needed by model template
 * @param {object} val The property definition
 * @param {string} propName The property name definition
 * @returns {object} Data for model-property template
 */
function createPropertyTemplateData(val, propName) {
  // shallow clone the object - don't modify original data!
  val = {...val};
  const inputType = val.type;
  const goType = inputType === 'uuid' ? 'string' : inputType;
  val.goType = val.required ? goType : `*${goType}`;
  const itemType = val.required ? val.itemType : `*${val.itemType}`;

  // Override goType based on certain type values
  if (inputType === 'array') {
    if (GO_BUILTIN_TYPES.includes(val.itemType)) {
      val.goType = `[]${itemType}`;
    } else {
      val.goType = '[]string';
    }
  }
  if (NON_GO_TYPES.includes(val.goType)) {
    val.goType = 'string';
  }

  if (val.defaultValue && NON_GO_TYPES.concat(['string']).includes(inputType)) {
    val.defaultValue = `${val.defaultValue}`;
  }

  // Convert Type to include '' for template
  val.type = `${val.goType}`;
  val.orgType = `${val.type}`;

  if (val.itemType) {
    val.itemType = `${val.itemType}`;
  }

  val.pascalName = pascalCase(propName);
  val.pascalName = val.pascalName.replace(/Id$/, 'ID');

  return val;
}

/**
 * Check if the type is a built-in type, return the canonical type name in
 * such case (e.g. convert 'String' to 'string').
 *
 * @param {string} typeName Property type name, e.g. 'String' or 'Address'
 * @returns {string|undefined}  Built-in type name (e.g. 'string') or undefined
 */
function findBuiltinType(typeName) {
  return BUILTIN_TYPES.find(t => t === typeName.toLowerCase());
}
