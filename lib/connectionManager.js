//Conexion Manager

// -----------------------
// Deps
// -----------------------
var MongoClient = require('mongodb').MongoClient;
var dbInstance = null;
var dbOpened = false;
var connectionUrl = null;
var when = require('when');

// -----------------------
// Methods
// -----------------------

var _pOpenConn = function _pOpenConn() {
  return when.promise(function(resolve, reject) {
    try {
      if (!connectionUrl) {
        return reject(new Error('The server url has not been set up'));
      }
      if (!dbInstance) {
        MongoClient.connect(connectionUrl, function(err, db) {
          if (err) {
            return reject(err);
          }
          dbInstance = db;
          dbOpened = true;
          return resolve(dbInstance);
        });
      } else {
        if (!dbOpened) {
          dbInstance.open(function(err, client) {
            return resolve(dbInstance);
          });
        } else {
          return resolve(dbInstance);
        }
      }
    } catch (err) {
      return reject(err);
    }
  });
};
//////////
var _pCloseConn = function _pCloseConn() {
  return when.promise(function(resolve, reject) {
    if (!dbInstance) {
      return reject(new Error('The conection is not opened'));
    } else {
      dbOpened = false;
      dbInstance.close();
      return resolve();
    }
  });
};
///////////
module.exports.pConnect = function pConnect(connectUrl) {
  return when.promise(function(resolve, reject) {
    try {
      if (connectUrl) {
        connectionUrl = connectUrl;
      }
      return _pOpenConn()
        .then(function(db) {
          return resolve(db);
        }, function(err) {
          return reject(err);
        });
    } catch (err) {
      return reject(err);
    }
  });
};
///////////
module.exports.pCloseConn = function pCloseConn() {
  return _pCloseConn();
};