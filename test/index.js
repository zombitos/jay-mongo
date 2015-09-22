/* global describe, it, before */
'use strict';



/* global describe, it, before */
'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var expect = chai.expect;
var IAMongo = require('../index');
var connUrl = 'mongodb://localhost/jaymongo';
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

          //REGISTER MODELS
          IAMongo
            .loadModels(__dirname + '/models/');
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
      .should.eventually.have.property('otherInfo')
      .and.have.property('hair')
      .notify(done);
  });


  it('Model makes insertion to DB', function(done) {
    Model.pCreate({
        name: 'Jose',
        lastname: 'Rodriguez',
        email: 'j@interaction.cr'
      }, null, {
        omitUndefined: true
      })
      .should.eventually.be.a('array')
      .notify(done);
  });

  it('uses a custom method', function(done) {
    Model
      .pFindByEmail('j@interaction.cr')
      .should.eventually.be.a('object')
      .and.have.property('name')
      .and.equals('Jose')
      .notify(done);
  });

  it('Model makes multiple insertions to DB', function(done) {
    Model.pCreate([{
        name: 'Nestor',
        lastname: 'Villalobos',
        email: 'nestor@interaction.cr'
      }, {
        name: 'Martin',
        lastname: 'Shaer',
        email: 'martin@interacion.cr'
      }, {
        name: 'Martin',
        lastname: 'Corrales',
        email: 'martin.corrales@interacion.cr'
      }],null, {
        omitUndefined: true
      })
      .should.eventually.be.a('array')
      .notify(done);
  });

  it('Updates add $inc', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      }, {
        inc: {
          clientNo: 1
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  it('Updates substract $inc', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      }, {
        inc: {
          counter: -2
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  // MONGO v 2.6 > needed
  // it('Updates $mul', function(done) {
  //   Model.pUpdate({
  //       email: 'j@interaction.cr'
  //     }, {
  //       mul: {
  //         clientNo: 4
  //       }
  //     })
  //     .should.eventually.be.a('object')
  //     .and.have.property('n')
  //     .and.equals(1)
  //     .notify(done);
  // });



  it('Updates $push simple', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      }, {
        push: {
          tags: 'charcos'
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  it('Updates $push with options', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      }, {
        push: {
          tags: {
            $each: ['javascript', 'mongo'],
            $slice: -2
          }
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  it('Updates $addToSet simple', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      }, {
        $addToSet: {
          tags: 'charcos'
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  it('Updates $addToSet with options', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      }, {
        addToSet: {
          tags: {
            $each: ['charcos', 'mongo', 'web']
          }
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  // MONGO 2.6 >
  // it('Updates $currentDate', function(done) {
  //   Model.pUpdate({
  //       email: 'j@interaction.cr'
  //     }, {
  //       $currentDate: {
  //         updatedAt: {
  //           $type: 'date'
  //         },
  //         deletedAt: true
  //       }
  //     })
  //     .should.eventually.be.a('object')
  //     .and.have.property('n')
  //     .and.equals(1)
  //     .notify(done);
  // });

  it('Updates $pop last', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      }, {
        pop: {
          tags: -1
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  it('Updates $pop first', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      }, {
        pop: {
          tags: 1
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  it('Updates $unset', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      }, {
        $unset: {
          counter: ''
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  it('Updates $rename', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      }, {
        rename: {
          tags: 'etiquetas'
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });


  it('Model updates existing document', function(done) {
    Model.pUpdate({
        email: 'j@interaction.cr'
      }, {
        set: {
          email: 'jprodma@gmail.com'
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .notify(done);
  });


  it('Model updates nested property document', function(done) {
    Model.pUpdate({
        email: 'jprodma@gmail.com'
      }, {
        set: {
          'otherInfo.hair': {
            color: 'black',
            type: 'curly'
          },
          'name': 'Jose Pablo'
        },
        inc: {
          clientNo: 1
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  it('Model updates nested property document', function(done) {
    Model.pUpdate({
        email: 'jprodma@gmail.com'
      }, {
        set: {
          'otherInfo.hair.color': {
            r: 0,
            g: 0,
            b: 0
          }
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  it('Model updates nested property document with non existing prop', function(done) {
    Model.pUpdate({
        email: 'jprodma@gmail.com'
      }, {
        set: {
          'otherInfo.height': 'short'
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  it('Model inserts new document with upsert', function(done) {
    Model.pUpdate({
        email: 'jose.rodriguez@interaction.cr'
      }, {
        set: {
          name: 'Pablo',
          lastname: 'Masís'
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      }, {
        upsert: true
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .notify(done);
  });

  it('Model finds and modifies existing document', function(done) {
    Model.pFindAndModify({
        email: 'jprodma@gmail.com'
      }, {
        set: {
          email: 'j@interaction.cr'
        }
      }, {
        new: true
      })
      .should.eventually.be.a('object')
      .and.have.property('email', 'j@interaction.cr')
      .notify(done);
  });

  it('Model finds one existing document', function(done) {
    Model.pFindOne({
        email: 'j@interaction.cr'
      }, {
        fields: {
          email: 0
        }
      })
      .should.eventually.be.a('object')
      .and.have.property('otherInfo')
      .and.have.property('hair')
      .and.have.property('color')
      .and.have.property('r')
      .and.equals(0)
      .notify(done);
  });

  it('Model finds many existing documents', function(done) {
    Model.pFindMany({
        email: 'j@interaction.cr'
      }, {
        fields: {
          email: 1
        },
        sort: [
          ['createdAt', 'desc'],
          ['name', 'desc']
        ]
      })
      .should.eventually.be.a('array')
      .notify(done);
  });

  it('Destroy document matching query, single document', function(done) {
    Model.pDestroy({
        email: 'jose.rodriguez@interaction.cr'
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(1)
      .notify(done);
  });

  it('Destroy document matching query, many documents', function(done) {
    Model.pDestroy({
        name: 'Martin'
      }, {
        justOne: 'false'
      })
      .should.eventually.be.a('object')
      .and.have.property('n')
      .and.equals(2)
      .notify(done);
  });

  it('Model counts existing documents', function(done) {
    Model.pCount({})
      .should.eventually.equals(2)
      .notify(done);
  });
});