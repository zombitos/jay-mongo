/* global module */
'use strict';

// -----------------------
// Deps
// -----------------------
var _ = require('underscore');
var when = require('when');
var schemas = {};
var Model = require('./lib/model');
var connManager = require('./lib/connectionManager');
var fs = require('fs');
// -----------------------
// Class Definition
// -----------------------
module.exports = {

  // -----------------------
  // Methods
  // -----------------------
  //SCOPE
  //register
  //pConnect
  //model

  /////
  register: function register(key, jschema, methods) {
    schemas[key] = new Model(key, jschema, methods);
  },

  //////
  pConnect: function pConnect(connectUrl) {
    return when.promise(function(resolve, reject) {
      connManager.pConnect(connectUrl)
        .then(function(db) {
          return resolve(db);
        }, function(err) {
          return reject(err);
        });
    });
  },

  /////
  loadModels: function loadModels(modelsPath) {
    fs.readdirSync(modelsPath).forEach(function(file) {
      if (~file.indexOf('.js')) require(modelsPath + file);
    });
  },
  /////
  model: function model(key) {
    return _.clone(schemas[key]);
  }
};