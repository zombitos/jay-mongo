/* global describe, it, before */
'use strict';



/* global describe, it, before */
'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var expect = chai.expect;
var JSchema = require('jay-schema');
var schemaOptions = {
  requiredErrorFormatter: function(key) {
    return key + ' is required';
  },
  typeErrorFormatter: function(key) {
    return key + ' is not of correct data type';
  }
};
var Jay = new JSchema({
  name: {
    required: true,
  },
  lastname: {
    required: true
  },
  phone: {
    type: Number,
    required: false
  },
  email: {
    type: String,
    required: true,
    index: 1,
    indexOptions: {
      unique: true
    },
    validator: function(val) {
      var regex = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
      if (!regex.test(val)) {
        return false;
      }
      return val;
    }
  },
  gender: {
    type: Boolean
  },
  id: {
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    required: true,
    index: 1,
    indexOptions: {
      unique: true
    },
    default: function() {
      return new Date();
    }
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, schemaOptions);
var struct = {};
var IAMongo = require('../index');
var connUrl = 'mongodb://localhost/iamongo';
var Model = null;
var helpers = require('./helpers');



chai.use(chaiAsPromised);
chai.should();


describe('Succesfull operations', function() {
  before(function(done) {
    IAMongo
      .pConnect(connUrl)
      .then(function() {
        console.log('Connected Correctly to DB');
        helpers.dropCollections(function(err) {
          if (err) done(err);
          done();
        });
      }, function(err) {
        done(err);
      });
  });

  it('registers model and creates struct', function(done) {
    IAMongo.register('Jay', Jay);
    Model = IAMongo.model('Jay');
    Model
      .pMakeStruct({
        name: 'Jose',
        lastname: 'Rodriguez',
        phone: '555',
        gender: 'false',
        email: 'j@interaction.cr',
        id: 111111111
      })
      .should.eventually.have.property('email')
      .notify(done);
  });

  it('Model makes insertion model to DB', function(done) {
    Model
      .pMakeStruct({
        name: 'Jose',
        lastname: 'Rodriguez',
        phone: '555',
        gender: 'false',
        email: 'j@interaction.cr',
        id: 111111111
      }).then(function(struct) {
        console.log('struct', struct);
        Model.pCreate(struct)
          .should.eventually.be.a('array')
          .notify(done);
      });
  });
});