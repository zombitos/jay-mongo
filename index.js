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
  register: function register(key, jschema) {
    schemas[key] = new Model(key, jschema);
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
  model: function model(key) {
    return _.clone(schemas[key]);
  }
};