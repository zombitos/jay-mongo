var JSchema = require('jay-schema');
var IAMongo = require('../../index');

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
  clientNo: {
    type: Number,
    default: 0
  },
  counter: {
    type: Number,
    default: 2
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
  emptyUniqueIndex:{
    type:String,
    index:-1,
    indexOptions: {
      unique: true,
      sparse: true
    }
  },
  otherInfo: {
    type: Object,
    default: {
      hair: 'black',
      eyes: 'brown'
    }
  },
  tags: {
    type: Array,
    default: []
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
  },
  updatedAt: {
    type: Date,
    default: null
  }
}, schemaOptions);

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

IAMongo.register('Jay', Jay, methods);