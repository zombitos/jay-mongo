Jay-Mongo
===============

Mongo DB Operations Framework to be used with jay-schema

## Installation

  npm install ia-mongo

## Basic Usage

  ### Vars
  ```javascript
  var jay-schema = require('jay-schema');
  var Jay-Mongo = require('jay-mongo');
  var connUrl = 'mongodb://localhost/jaymongo';

  ```

  ### Connect to Database
  ```javascript
  Jay-Mongo
    .pConnect(connUrl)
    .then(function() {
      console.log('Connected Correctly to DB');
      });
    }, function(err) {
      console.log(err);
    });
  ```

  ### Create a Schema with jay-schema
  ```javascript
  var JaySchema = new jay-schema({
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
  ```
  ### Register the model to Jay-Mongo

  Basic registration
  ```javascript
  Jay-Mongo.register('Jay', JaySchema);
  ```

  You can register custom methods to add extra operations, or operation wrappers to the models

  ```javascript
  var methods = {
    sayHello: function() {
      return 'Hello';
    },
    pFindByEmail: function(email) {
      return this.pFindOne({
        email: email
      }).then(function(result) {
        return result;
      }, function() {
        return 'ERROR!!!!';
      })
    }
  };
  Jay-Mongo.register('Jay', JaySchema,methods);
  ```
  Methods parameter needs to be an object.
  Methods properties names need to different form Jay-MONGO reserved operation names:
    pMakeStruct
    pFindAndModify
    pUpdate
    pDestroy
    pCreate
    pFindOne
    pFindMany
    pCount

  ### Load Models
  You can use loadModels method to require the files of a folder where your models are, that way you can make sure when you call a model it has already been registered

  ```javascript
  Jay-Mongo.loadModels(__dirname + '/models/');
  ```

  ###Express app.js example
  ```javascript
  Jay-Mongo.pConnect(config.db)
    .then(function() {
      Jay-Mongo.loadModels(__dirname + '/_app/models/');
      var app = express();
      //EXPRESS CONFIGURATION WOULD BE HERE
      module.exports = app;
    }, function(err) {
      console.error('Jay-MONGO CONNECTION ERROR:', err);
    });
  ```

  ### Get the registered Model
  ```javascript
  var Jay = Jay-Mongo.model('Jay');
  ```
  ### Create an Struct Manually
  ```javascript
  Jay.pMakeStruct({
      name: 'Jose',
      lastname: 'Rodriguez',
      email: 'j@gmail.com'
    }).then(function(result) {
        console.log('struct', result);
      });
  ```

  ### Make an insertion to DB
  ```javascript
  Jay.pCreate({
      name: 'Jose',
      lastname: 'Rodriguez',
      email: 'j@gmail.com'
    })
    .then(function(result) {
        console.log('new Jay', result[0]);
      });
  ```
  ### Use a custom operation
  ```javascript
  Jay.pFindByEmail('j@gmail.com').then(function(result) {
    console.log('Found Jay', result);
  });
  ```

## Posible Operations To DB (Doc in progress)

  ### All operations will return a promise

  ### Check <a href='https://github.com/zombitos/jay-schema'>jay-Schema</a> documentation for Schema Details
  ```javascript
  Jay.pMakeStruct(data,options,extention)
  ```
  
  ### Find and Modify
  ```javascript
  Jay.pFindAndModify(query, data, options)
  ```
  Query: the search criteria the document needs to meet to be updated

  Data: Update Object, needs to be 
  key = Valid Mongodb update operator(Such as set, push, inc. Check mongodb documentation for operators) 
  value = object with poperties to update
  **Note: The operators can with or without the '$' sign

  ```javascript
  //Example
   Model.pFindAndModify({
        email: 'test@email.com'
      }, {
        set: {
          email: 'test2@email.cr'
        },
        $inc:{
          timesLogged: 1
        }
      }, {
        new: true
      })
  ```

  Options: Options available to mongodb for findAndModify, such as {new:true}. Search mongoDB documentation for available options
  **Note: results sorting needs to be defined withing options paramenter
  ```javascript
  {
    sort:{createdAt:1}
  }
  ```

  pFindAndModify will run jay-schema pMakeStruct operation with option 
  omitUndefined set to true to validate the data parameter.
  Check <a href='https://github.com/zombitos/jay-schema'>jay-Schema</a> documentation for Schema Details

  ### Update
  ```javascript
  Jay.pUpdate(query, data, options)
  ```
  Query: the search criteria the document needs to meet to be updated

  Data: Update Object, needs to be 
  key = Valid Mongodb update operator(Such as set, push, inc. Check mongodb documentation for operators) 
  value = object with poperties to update
  **Note: The operators can with or without the '$' sign

  ```javascript
  //Example
   Model.pUpdate({
        email: 'test@test.cr'
      }, {
        set: {
          name: 'Hola',
          lastname: 'Mundo'
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      }, {
        upsert: true
      })
  ```

  Options: Options available to mongodb for update, such as {upsert:true}. Search mongoDB documentation for available options

  pUpdate will run jay-schema pMakeStruct operation with option 
  omitUndefined set to true to validate the data parameter.
  Check <a href='https://github.com/zombitos/jay-schema'>jay-Schema</a> documentation for Schema Details


  ### Create
  ```javascript
  Jay.pCreate(data, options, schemaOptions)
  ```
  Data parameter can be an object or an array of objects.
  Either way the result will be an array of objects with the new
  documents.

  Options object, check mongodb documentation for inserting options.

  schemaOptions object, jay-schema option, omitUndefined : true is required for index in unique and sparse to work. 

  pCreate will run jay-schema pMakeStruct operation to validate the data parameter.
  Check <a href='https://github.com/zombitos/jay-schema'>jay-Schema</a> documentation for Schema Details

  ### Find One
  ```javascript
  Jay.pFindOne(query, options)
  ```
  Query: the search criteria the document needs to meet to be found

  Options: fields to be returned or excluded, mongo does not allow
  excluding and including fields definition.
  ```javascript
  //INCLUDING FIELDS
  {
    fields:{
      createdAt:1
    }
  }
  //EXCLUDING FIELDS
  {
    fields:{
      _id:0,
      email:0
    }
  }
  ```
  ### Find Many
  ```javascript
  Jay.pFindMany(query, options)
  ```
  Query: the search criteria the documents need to meet to be found

  Options: fields to be returned or excluded, mongo does not allow
  excluding and including fields definition.
  Also other options such as sorting, check mongo documentation
  for available options.
  ```javascript
  //INCLUDING FIELDS
  {
    fields:{
      createdAt:1
    }
  }
  //EXCLUDING FIELDS
  {
    fields:{
      _id:0,
      email:0
    }
  }
  ```
  ```javascript
  //SORTING NEEDS TO BE DONE IN ARRAY NOTATION
  {
    fields:{
      createdAt:1
    }
    sort:[['createdAt','desc'],['name','asc']]
  }
  ```
  ### Destroy
  ```javascript
  Jay.pDestroy(query, options)
  ```
  Query: the search criteria the documents need to meet to be destroyed

  Options: justOne: Boolean, default true. If true only destroys the first document found, 
  if false it deletes all documents that meet the criteria
  ```javascript
  //DESTROYS FIRST FOUND
  {
    justOne: true //default
  }
  //DESTROYS ALL THAT MEET CRITERIA
  {
    justOne: false
  }
  ```

  ### Count
  ```javascript
  Jay.pCount(query)
  ```
## Tests

  npm test

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Release History

* 1.0.0 Init fork