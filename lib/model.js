'use strict';

//--------------
//VARS
//--------------

var _ = require('underscore');
var when = require('when');
var connManager = require('./connectionManager');
var idParser = require('./idParser');

module.exports = function(docName, schema) {

  // -----------------------
  // Atributes
  // -----------------------
  var _schema = schema;
  var _docName = docName.toLowerCase() + 's';
  // -----------------------
  // Methods
  // -----------------------
  //SCOPE
  //this.pCreate
  //this.pFindOne
  //this.pFindMany
  //this.pUpdate
  //this.pFindAndModify
  //this.pCount
  //this.pMakeStruct

  _schema.eachPath(function(val, key) {
    try {
      if (val.index === 1 || val.index === -1) {
        var indexKey = {};
        indexKey[key] = val.index;
        connManager.pConnect()
          .then(function(db) {
            db
              .collection(_docName)
              .ensureIndex(indexKey, val.indexOptions || {}, function(err) {
                if (err) {
                  throw err;
                }
              });
          }, function(err) {
            throw err;
          });
      }
    } catch (err) {
      console.log('Index Error', err);
      throw err;
    };
  });

  //////
  this.pMakeStruct = function pMakeStruct(data, extention, options) {
    return _schema.pMakeStruct(data, extention, options);
  };
  //////

  /**
   * Actualiza el modelo dado con FIND AND MODIFY
   * - query <Object> criterio de busqueda del registro
   * - update <Object> criteria de actualizacion
   * - options <Object> opciones de actualizacion
   * returns: <Promise>
   */
  this.pFindAndModify =
    function pFindAndModify(query, update, options) {
      var promise;
      //
      query = typeof query === 'undefined' ? {} : query;
      //
      if (query._id) {
        query = idParser(query);
      }
      //
      promise = when.promise(function(resolve, reject) {
        try {
          connManager.pConnect()
            .then(function(db) {
                options = options || {};
                ////
                var collection = db.collection(_docName);
                collection.findAndModify(
                  query,
                  options.sort || {},
                  update,
                  options,
                  function(err, result) {
                    if (err) {
                      return reject(err);
                    } else {
                      return resolve(result.value);
                    }
                  });
              },
              function(err) {
                return reject(err);
              });
        } catch (err) {
          reject(err);
        }
      });
      return promise;
    };

  /**
   * Actualiza el modelo dado
   * - query <Object> criterio de busqueda del registro
   * - update <Object> criteria de actualizacion
   * - options <Object> opciones de actualizacion
   * returns: <Promise>
   */
  this.pUpdate =
    function pUpdate(query, update, options) {
      var promise;
      //
      query = typeof query === 'undefined' ? {} : query;
      //
      if (query._id) {
        query = idParser(query);
      }
      //
      promise = when.promise(function(resolve, reject) {
        try {
          connManager.pConnect()
            .then(function(db) {
                var collection = db.collection(_docName);
                collection.update(
                  query,
                  update,
                  options || {},
                  function(err, result) {
                    if (err) {
                      return reject(err);
                    } else {
                      return resolve(result.toJSON());
                    }
                  });
              },
              function(err) {
                return reject(err);
              });
        } catch (err) {
          reject(err);
        }
      });
      return promise;
    };

  /**
   * Inserta un registro al modelo
   * - struct <Object> struct del modelo o array de structs
   * - optExtention <Object> opciones extras de insercion
   * returns: <Promise> //Resultados son un array
   */
  this.pCreate =
    function pCreate(struct, options) {
      var promise,
        defaultOptions = {
          w: 1
        }
      if (!options ||
        Object.prototype.toString.call(options) !== '[object Object]') {
        options = defaultOptions;
      }
      for (var x in defaultOptions) {
        if (typeof options[x] === 'undefined') {
          options[x] = defaultOptions[x];
        }
      }
      promise = when.promise(function(resolve, reject) {
        try {
          connManager.pConnect()
            .then(function(db) {
              var collection = db.collection(_docName);
              collection.insert(struct, options, function(err, result) {
                if (err) {
                  return reject(err);
                } else {
                  return resolve(result.ops);
                }
              });
            }, function(err) {
              return reject(err);
            });
        } catch (err) {
          console.log('insert catch', err);
          reject(err);
        }
      });
      return promise;
    };

  /**
   * Encuentra un registro unico del modelo
   * - query <Object> criterio de busqueda
   * - options <Object> opciones de campos de vuelta
   * returns: <Promise>
   */
  this.pFindOne =
    function pFindOne(query, options) {
      var promise;
      //
      query = typeof query === 'undefined' ? {} : query;
      //
      if (query._id) {
        query = idParser(query);
      }
      //
      options = options || {};
      //
      promise = when.promise(function(resolve, reject) {
        try {
          connManager.pConnect()
            .then(function(db) {
                var collection = db.collection(_docName);
                collection.findOne(
                  query,
                  options.fields || {},
                  function(err, doc) {
                    if (err) {
                      return reject(err);
                    } else {
                      return resolve(doc);
                    }
                  });
              },
              function(err) {
                return reject(err);
              });
        } catch (err) {
          return reject(err);
        }
      });
      return promise;
    };

  /**
   * Encuentra multiples registros del modelo
   * - query <Object> criterio de busqueda
   * - opciones <Object> opciones de resultados
   * returns: <Promise>
   */
  this.pFindMany =
    function pFindMany(query, options) {
      var promise;
      //
      query = typeof query === 'undefined' ? {} : query;
      //
      if (query._id) {
        query = idParser(query);
      }
      //
      options = options || {};
      promise = when.promise(function(resolve, reject) {
        try {
          connManager.pConnect()
            .then(function(db) {
                var collection = db.collection(_docName);
                collection.find(
                  query,
                  options.fields || {},
                  options).toArray(
                  function(err, doc) {
                    if (err) {
                      return reject(err);
                    } else {
                      return resolve(doc);
                    }
                  });
              },
              function(err) {
                return reject(err);
              });

        } catch (err) {
          return reject(err);
        }
      });
      return promise;
    };

  /**
   * Encuentra multiples registros del modelo
   * - query <Object> criterio de busqueda
   * returns: <Promise>
   */
  this.pCount =
    function pCount(query) {
      var promise;
      //
      query = typeof query === 'undefined' ? {} : query;
      //
      if (query._id) {
        query = idParser(query);
      }
      //
      promise = when.promise(function(resolve, reject) {
        try {
          connManager.pConnect()
            .then(function(db) {
                var collection = db.collection(_docName);
                collection.find(
                  query).count(
                  function(err, number) {
                    if (err) {
                      return reject(err);
                    } else {
                      return resolve(number);
                    }
                  });
              },
              function(err) {
                return reject(err);
              });

        } catch (err) {
          return reject(err);
        }
      });
      return promise;
    };
};