IAMongo
===============

Mongo DB Operations Framework to be used with ia-schema

## Installation

  npm install ia-mongo

## Usage

  # Vars
  ```javascript
  var IASchema = require('ia-schema');
  var IAMongo = require('ia-mongo');
  var connUrl = 'mongodb://localhost/iamongo';
  ```

  # Connect to Database
  ```javascript
  IAMongo
    .pConnect(connUrl)
    .then(function() {
      console.log('Connected Correctly to DB');
      });
    }, function(err) {
      console.log(err);
    });
  ```

  # Create a Schema with ia-schema
  ```javascript
  var JaySchema = new IASchema({
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
  ```
  # Register the model to IAMongo
  ```javascript
  IAMongo.register('Jay', JaySchema);
  ```

  # Get the registered Model
  ```javascript
  var Jay = IAMongo.model('Jay');
  ```
  # Create a Struct
  ```javascript
  var struct = {};
  Jay.pMakeStruct({
    name: 'Jose',
        lastname: 'Rodriguez',
        phone: '555',
        gender: 'false',
        email: 'j@interaction.cr',
        id: 111111111
    }).then(function(result) {
        struct = result;
        console.log('struct', struct);
      });
  ```
  # Make a insertion to DB
  ```javascript
  Jay.pCreate(struct)
    .then(function(result) {
        console.log('new Jay', result[0]);
      });
  ```
## Posible Operations To DB (Doc in progress)
  # Check <a href=''>IA-Schema</a> documentation for Schema Details
  ```javascript
  Jay.pMakeStruct(data,extention,options)
  ```
  
  # Find and Modify
  ```javascript
  Jay.pFindAndModify(query, update, options)
  ```

  # Update
  ```javascript
  Jay.pUpdate(query, update, options)
  ```

  # Create
  ```javascript
  Jay.pCreate(struct, options)
  ```
  # Find One
  ```javascript
  Jay.pFindOne(query, options)
  ```
  # Find Many
  ```javascript
  Jay.pFindMany(query, options)
  ```
  # Count
  ```javascript
  Jay.pCount(query)
  ```
## Tests

  npm test

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Release History

* 0.0.1 Initial release