'use strict';

//--------------
//VARS
//--------------

var _ = require('underscore');
var when = require('when');
var connManager = require('./connectionManager');
var idParser = require('./idParser');
// -----------------------
module.exports = function (docName, schema, methods) {

  // -----------------------
  // Atributes
  // -----------------------
  var _schema = schema;
  var _docName = docName.toLowerCase() + 's';
  ///////////
  var _updateOperators = [
    '$inc',
    '$mul',
    '$rename',
    '$setOnInsert',
    '$set',
    '$unset',
    '$min',
    '$max',
    '$currentDate',
    '$addToSet',
    '$pop',
    '$pullAll',
    '$pull',
    '$pushAll',
    '$push',
    '$bit'
  ];
  var _structIgnoreOps = ['$rename', '$pop', '$pull', '$pullAll', '$bit'];
  var _restrictedMethods = ['pMakeStruct',
    'pFindAndModify',
    'pUpdate',
    'pDestroy',
    'pCreate',
    'pFindOne',
    'pFindMany',
    'pCount'
  ];
  //////////
  var _pValidateUpdate = function (data) {
    return when.promise(function (resolve, reject) {
      var promises = [];
      var nestedProps = {};
      var _pStructMaker = function (data, prop) {
        return when.promise(function (resolve, reject) {
          var originalData;
          var isComplex = false;
          ///////////
          if (prop === '$unset') {
            isComplex = true;
            originalData = _.clone(data);
            var schemaProp;
            for (var z in data) {
              schemaProp = _schema.path(z);
              if (!schemaProp) {
                return reject(z + 'is not defined in the schema');
              }
              if (schemaProp.required) {
                return reject('Cannot unset ' +
                  z + ' because is required.');
              }
              data[z] = null;
            }
          }
          ///////////
          if (prop === '$currentDate') {
            isComplex = true;
            originalData = _.clone(data);
            var schemaProp;
            for (var z in data) {
              schemaProp = _schema.path(z);
              if (!schemaProp) {
                return reject(z + 'is not defined in the schema');
              }
              if (schemaProp.type !== Date) {
                return reject('To use $currentDate ' +
                  z + ' must be type Date in schema.');
              }
              if (Object.prototype.toString.call(data[z]) === '[object Object]') {
                if (data[z].$type !== 'timestamp' && data[z].$type !== 'date') {
                  return reject('$currentDate object need to have a valid $type');
                }
              } else if (data[z] !== true) {
                return reject('$currentDate property needs to' +
                  ' be true or an object with $type');
              }
              data[z] = new Date();
            }
          }
          ///////////
          if (prop === '$addToSet') {
            isComplex = true;
            originalData = _.clone(data);
            var schemaProp;
            for (var z in data) {
              schemaProp = _schema.path(z);
              if (!schemaProp) {
                return reject(z + 'is not defined in the schema');
              }
              if (schemaProp.type !== Array) {
                return reject('To use $addToSet ' +
                  z + ' must be type Array in schema.');
              }
              if (Object.prototype.toString.call(data[z]) === '[object Object]') {
                if (!data[z].$each ||
                  Object.prototype.toString.call(data[z].$each) !== '[object Array]') {
                  return reject('To use $addToSet ' +
                    z + ' property as an object you need to use $each property.');
                } else {
                  data[z] = data[z].$each;
                }
              } else {
                data[z] = [data[z]];
              }
            }
          }
          ///////////
          if (prop === '$push') {
            isComplex = true;
            originalData = _.clone(data);
            var schemaProp;
            for (var z in data) {
              schemaProp = _schema.path(z);
              if (!schemaProp) {
                return reject(z + 'is not defined in the schema');
              }
              if (schemaProp.type !== Array) {
                return reject('To use $push ' +
                  z + ' must be type Array in schema.');
              }
              if (Object.prototype.toString.call(data[z]) === '[object Object]') {
                if (Object.prototype.toString.call(data[z].$each) !== '[object Array]') {
                  return reject('To use $push ' +
                    z + ' property as an object you need to use $each property.');
                } else {
                  data[z] = data[z].$each;
                }
              } else {
                data[z] = [data[z]];
              }
            }
          }
          ///////////
          _schema.pMakeStruct(data, {
            omitUndefined: true
          }).then(function (struct) {
            var result = {};
            result[prop] = struct;
            if (isComplex) {
              result[prop] = originalData;
            }
            return resolve(result);
          }, function (err) {
            return reject(err);
          });
        });
      };
      ////////////////
      var buildNested = function (props, val) {
        var n = props.length;
        var temp = val;
        for (; n > 0; n--) {
          var obj = {};
          obj[props[n - 1]] = temp;
          temp = obj;
        }
        return temp;
      };
      var compressNested = function (obj) {
        var compressed = '';
        var getKeys = function (obj) {
          var c = Object.keys(obj)[0];
          compressed += c + '.'
          return c;
        };
        var temp = obj[getKeys(obj)];
        while (Object.prototype.toString.call(temp) ===
          '[object Object]') {
          temp = temp[getKeys(temp)];
        }
        var result = {};
        compressed = compressed.slice(0, -1);
        result['' + compressed + ''] = temp;
        return result;
      };
      ///////
      if (Object.prototype.toString.call(data) !==
        '[object Object]') {
        return reject('Invalid update object');
      }
      for (var x in data) {
        ///////////
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
        if (_updateOperators.indexOf(x) === -1) {
          return reject('Invalid update operator, ' +
            'check mongo documentation for further information.');
        }

        if (_structIgnoreOps.indexOf(x) !== -1) {
          var temp = {};
          temp[x] = data[x];
          promises.push(temp);
        } else {
          for (var y in data[x]) {
            //TODO: add support for http://docs.mongodb.org/manual/reference/operator/update/positional/
            if (y.toString().indexOf('.') !== -1) {
              var props = y.split('.');
              data[x] = _.extend(data[x], buildNested(props, data[x][y]));
              nestedProps[x] = nestedProps[x] ? nestedProps[x] : {
                hasNested: []
              };
              nestedProps[x].hasNested.push(props[0]);
            }
          }
          promises.push(_pStructMaker(data[x], x));
        }
        //////////
      }
      when.settle(promises).then(function (descriptors) {
        var errors = [];
        var structs = {};
        descriptors.forEach(function (d) {
          if (d.state === 'rejected') {
            errors.push(d.reason);
          } else {
            for (var x in d.value) {
              if (nestedProps[x]) {
                for (var y in d.value[x]) {
                  for (var i = 0, n = nestedProps[x].hasNested.length; i < n; i++) {
                    if (y === nestedProps[x].hasNested[i]) {
                      var tocompress = {};
                      tocompress[y] = d.value[x][y];
                      delete d.value[x][y];
                      _.extend(d.value[x], compressNested(tocompress));
                    }
                  }
                }
              }
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

  _schema.eachPath(function (val, key) {
    try {
      if (val.index === 1 || val.index === -1) {
        var indexKey = {};
        indexKey[key] = val.index;
        connManager.pConnect()
          .then(function (db) {
            db
              .collection(_docName)
              .ensureIndex(indexKey, val.indexOptions || {}, function (err) {
                if (err) {
                  throw err;
                }
              });
          }, function (err) {
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
      promise = when.promise(function (resolve, reject) {
        try {
          connManager.pConnect()
            .then(function (db) {
                options = options || {};
                ////
                _pValidateUpdate(data)
                  .then(function (updateData) {
                    var collection = db.collection(_docName);
                    collection.findAndModify(
                      query,
                      options.sort || {},
                      updateData,
                      options,
                      function (err, result) {
                        if (err) {
                          return reject(err);
                        } else {
                          return resolve(result.value);
                        }
                      });
                  }, function (errs) {
                    return reject(errs);
                  });
                ///
              },
              function (err) {
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
      promise = when.promise(function (resolve, reject) {
        try {
          connManager.pConnect()
            .then(function (db) {
                ////
                var collection = db.collection(_docName);
                options = options || {};
                ///
                _pValidateUpdate(data)
                  .then(function (updateData) {
                    var collection = db.collection(_docName);
                    collection.update(
                      query,
                      updateData,
                      options,
                      function (err, result) {
                        if (err) {
                          return reject(err);
                        } else {
                          return resolve(result.toJSON());
                        }
                      });
                  }, function (errs) {
                    return reject(errs);
                  });
              },
              function (err) {
                return reject(err);
              });
        } catch (err) {
          reject(err);
        }
      });
      return promise;
    };

  /**
   * Elimina los datos que coinciden con el query
   * - query <Object> criterio de busqueda del registro
   * - options <Object> opciones de borrado
   * returns: <Promise>
   */
  this.pDestroy =
    function pDestroy(query, options) {
      var promise,
        defaultOptions = {
          justOne: true
        };
      if (!options ||
        Object.prototype.toString.call(options) !== '[object Object]') {
        options = defaultOptions;
      };
      //
      query = typeof query === 'undefined' ? {} : query;
      //
      if (query._id) {
        query = idParser(query);
      }
      //
      promise = when.promise(function (resolve, reject) {
        try {
          connManager.pConnect()
            .then(function (db) {
                ////
                if (typeof options.justOne !== 'undefined' &&
                  options.justOne !== null) {
                  options.justOne = options.justOne === 'true' ||
                    options.justOne === '1' || options.justOne === 1 ? true : true;
                  options.justOne = options.justOne === 'false' ||
                    options.justOne === '0' || options.justOne === 0 ? false : true;
                } else {
                  options.justOne = true;
                }
                var collection = db.collection(_docName);
                collection.remove(
                  query,
                  options.justOne,
                  function (err, result) {
                    if (err) {
                      return reject(err);
                    } else {
                      return resolve(result.toJSON());
                    }
                  });
              },
              function (err) {
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
      promise = when.promise(function (resolve, reject) {
        try {
          connManager.pConnect()
            .then(function (db) {
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
                    .then(function (descriptors) {
                      var errores = [];
                      var structs = [];
                      descriptors.forEach(function (d) {
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

                      collection.insert(structs, options, function (err, result) {
                        if (err) {
                          return reject(err);
                        } else {
                          return resolve(result.ops);
                        }
                      });
                    });
                } else {
                  _schema.pMakeStruct(data)
                    .then(function (struct) {
                      collection.insert(struct, options, function (err, result) {
                        if (err) {
                          return reject(err);
                        } else {
                          return resolve(result.ops);
                        }
                      });
                    }, function (err) {
                      return reject(err);
                    });
                }
              },
              function (err) {
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
      promise = when.promise(function (resolve, reject) {
        try {
          connManager.pConnect()
            .then(function (db) {
                var collection = db.collection(_docName);
                collection.findOne(
                  query,
                  options.fields || {},
                  function (err, doc) {
                    if (err) {
                      return reject(err);
                    } else {
                      return resolve(doc);
                    }
                  });
              },
              function (err) {
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
      promise = when.promise(function (resolve, reject) {
        try {
          connManager.pConnect()
            .then(function (db) {
                var collection = db.collection(_docName);
                collection.find(
                  query,
                  options.fields || {},
                  options).toArray(
                  function (err, doc) {
                    if (err) {
                      return reject(err);
                    } else {
                      return resolve(doc);
                    }
                  });
              },
              function (err) {
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
      promise = when.promise(function (resolve, reject) {
        try {
          connManager.pConnect()
            .then(function (db) {
                var collection = db.collection(_docName);
                collection.find(
                  query).count(
                  function (err, number) {
                    if (err) {
                      return reject(err);
                    } else {
                      return resolve(number);
                    }
                  });
              },
              function (err) {
                return reject(err);
              });

        } catch (err) {
          return reject(err);
        }
      });
      return promise;
    };

  ////////////////
  //EXTEND METHODS
  ////////////////
  if (Object.prototype.toString.call(methods) === '[object Object]') {
    for (var x in methods) {
      if (_restrictedMethods.indexOf(x) === -1) {
        this[x] = methods[x];
      }
    }
  }
};