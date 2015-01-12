'use strict';

var connManager = require('../lib/connectionManager'),
  Helpers = {
    dropCollections: function(done) {
      connManager.pConnect()
        .then(function(db) {
          db.dropDatabase(function(err) {
            if (err) {
              done(err);
            } else {
              console.log('DataBase Dropped');
              done();
            }
          });
        }, function(err) {
          done(err);
        });
    }
  };

module.exports = Helpers;