/* global describe, it, before */
'use strict';



/* global describe, it, before */
'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var expect = chai.expect;
var JSchema = require('ia-schema');
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
  createdAt: {
    type: Date,
    required: true,
    index: 1,
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

          //REGISTER MODEL
          IAMongo.register('Jay', Jay);
          Model = IAMongo.model('Jay');
          done();
        });
      }, function(err) {
        done(err);
      });
  });

  it('creates struct', function(done) {
    Model
      .pMakeStruct({
        name: 'Jose',
        lastname: 'Rodriguez',
        email: 'j@interaction.cr'
      })
      .should.eventually.have.property('email')
      .notify(done);
  });

  it('Model makes insertion to DB', function(done) {
    Model.pCreate({
        name: 'Jose',
        lastname: 'Rodriguez',
        email: 'j@interaction.cr'
      })
      .should.eventually.be.a('array')
      .notify(done);
  });

  it('Model makes multiple insertions to DB', function(done) {
    Model.pCreate([{
        name: 'Nestor',
        lastname: 'Villalobos',
        email: 'nestor@interaction.cr'
      },{name:'Martin',
      lastname:'Shaer',
      email:'martin@interacion.cr'}])
      .should.eventually.be.a('array')
      .notify(done);
  });

  it('Model updates existing document', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      },'set',{
        email: 'jprodma@gmail.com'
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .notify(done);
  });

  it('Model finds and modifies existing document', function(done) {
    Model.pFindAndModify({
        email: 'jprodma@gmail.com'
      },'set',{
        email: 'j@interaction.cr'
      },{
        new: true
      })
      .should.eventually.be.a('object')
      .and.have.property('email','j@interaction.cr')
      .notify(done);
  });

  it('Model finds one existing document', function(done) {
    Model.pFindOne({
        email: 'j@interaction.cr'
      },{
        fields:{
          email:0
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('name','Jose')
      .notify(done);
  });

  it('Model finds many existing documents', function(done) {
    Model.pFindMany({
        email: 'j@interaction.cr'
      },{
        fields:{
          email:1
        },
        sort:[['createdAt','desc'],['name','desc']]
      })
      .should.eventually.be.a('array')
      .notify(done);
  });

  it('Model counts existing documents', function(done) {
    Model.pCount({})
      .should.eventually.equals(3)
      .notify(done);
  });
});