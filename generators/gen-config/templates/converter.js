/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

// @IMPORTANT: Need to be synced with the gen-config/templates/model-scheme.js.ejs file!!
exports.generateNewProps = properties => {
  const newProps = [];
  Object.entries(properties).forEach(([propKey, propVal]) => {
    newProps.push({
      name: propVal.pascalName,
      propKey: propKey,
      orgType: propVal.type,
      goType: propVal.goType,
      isRequired: propVal.required,
      filterable: propVal.filterable,
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
