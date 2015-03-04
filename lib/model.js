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
  var _pValidateUpdate = function(data) {
    return when.promise(function(resolve, reject) {
      var promises = [];
      var _pStructMaker = function(data, prop) {
        return when.promise(function(resolve, reject) {
          _schema.pMakeStruct(data, {
            omitUndefined: true
          }).then(function(struct) {
            var result = {};
            result[prop] = struct;
            return resolve(result);
          }, function(err) {
            return reject(err);
          });
        });
      };
      if (Object.prototype.toString.call(data) !==
        '[object Object]') {
        return reject('Invalid update object');
      }
      for (var x in data) {
        if (Object.prototype.toString.call(data[x]) !==
          '[object Object]') {
          return reject('Invalid update object, you should ' +
            'always' +
            ' use an update operator');
        }
        if (x.indexOf('$') === -1) {
          var temp = data[x];
          delete data[x];
          x = '$' + x;
          data[x] = temp;
        }
        promises.push(_pStructMaker(data[x], x));
      }
      when.settle(promises).then(function(descriptors) {
        var errors = [];
        var structs = {};
        descriptors.forEach(function(d) {
          if (d.state === 'rejected') {
            errors.push(d.reason);
          } else {
            for (var x in d.value) {
              structs[x] = d.value[x];
            }
          }
        });
        if (errors.length > 0) {
          return reject(errors);
        }
        return resolve(structs);
      });
    });
  };
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
  this.pMakeStruct = function pMakeStruct(data, options, extention) {
    return _schema.pMakeStruct(data, options, extention);
  };
  //////

  /**
   * Actualiza el modelo dado con FIND AND MODIFY
   * - query <Object> criterio de busqueda del registro
   * - data <Object> criteria de actualizacion
   * - options <Object> opciones de actualizacion
   * returns: <Promise>
   */


  /////////////
  this.pFindAndModify =
    function pFindAndModify(query, data, options) {
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
                _pValidateUpdate(data)
                  .then(function(updateData) {
                    var collection = db.collection(_docName);
                    collection.findAndModify(
                      query,
                      options.sort || {},
                      updateData,
                      options,
                      function(err, result) {
                        if (err) {
                          return reject(err);
                        } else {
                          return resolve(result.value);
                        }
                      });
                  }, function(errs) {
                    return reject(errs);
                  });
                ///
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
   * - data <Object> criteria de actualizacion
   * - options <Object> opciones de actualizacion
   * returns: <Promise>
   */
  this.pUpdate =
    function pUpdate(query, data, options) {
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
                ////
                var collection = db.collection(_docName);
                options = options || {};
                ///
                _pValidateUpdate(data)
                  .then(function(updateData) {
                    var collection = db.collection(_docName);
                    collection.update(
                      query,
                      updateData,
                      options,
                      function(err, result) {
                        if (err) {
                          return reject(err);
                        } else {
                          return resolve(result.toJSON());
                        }
                      });
                  }, function(errs) {
                    return reject(errs);
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
   * - data <Object> data del modelo o array de datas
   * - optExtention <Object> opciones extras de insercion
   * returns: <Promise> //Resultados son un array
   */
  this.pCreate =
    function pCreate(data, options) {
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
                var structPromises = [];
                var sPL = 0;
                var collection = db.collection(_docName);
                ///
                if (Object.prototype.toString.call(data) === '[object Array]') {
                  for (var i = 0, n = data.length; i < n; i++) {
                    structPromises.push(_schema.pMakeStruct(data[i]));
                    sPL++;
                  }
                }
                if (sPL > 0) {
                  when.settle(structPromises)
                    .then(function(descriptors) {
                      var errores = [];
                      var structs = [];
                      descriptors.forEach(function(d) {
                        if (d.state === 'rejected') {
                          // if (env === 'development') console.log('reason', d);
                          errores.push(d.reason);
                        } else {
                          structs.push(d.value);
                        }
                      });

                      if (errores.length) {
                        return reject(errores);
                      }

                      collection.insert(structs, options, function(err, result) {
                        if (err) {
                          return reject(err);
                        } else {
                          return resolve(result.ops);
                        }
                      });
                    });
                } else {
                  _schema.pMakeStruct(data)
                    .then(function(struct) {
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
                }
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