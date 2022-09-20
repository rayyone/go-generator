/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

const {GO_BUILTIN_TYPES} = require('../../model/property-definition');
const {convertToGoLangType} = require('../../helpers');

// @IMPORTANT: Need to be synced with the gen-config/templates/model-scheme.js.ejs file!!
exports.generateNewProps = properties => {
  const newProps = [];
  Object.entries(properties).forEach(([propKey, propVal]) => {
    let orgGoType = propVal.type === 'uuid' ? 'string' : propVal.type;
    propVal.goType = convertToGoLangType(propVal.goType)
    if (propVal.type === 'array') {
      if (GO_BUILTIN_TYPES.includes(propVal.itemType)) {
        orgGoType = propVal.itemType;
      } else {
        orgGoType = 'string';
      }
    }
    newProps.push({
      name: propVal.pascalName,
      propKey: propKey,
      orgType: orgGoType,
      goType: propVal.goType,
      isRequired: propVal.required,
      isNullable: propVal.nullable,
      filterable: propVal.filterable || false,
      filterType: propVal.filterType,
    });
  });
  return newProps;
};

exports.generateDefaultConfigTemplate = ({appModName} = {}) => {
  return {
    appModName,
  };
};
