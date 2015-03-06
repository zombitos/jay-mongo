var ObjectId = require('mongodb').ObjectID;
module.exports = function idParser(query) {
  //TODO REVISAR MAS OPERACIONES DONDE HAYA QUE HACER EL PARSE
  var i = 0;
  if (query._id.$in) {
    for (i = 0; i < query._id.$in.length; i++) {
      query._id.$in[i] = new ObjectId(query._id.$in[i]);
    }
    return query;
  }
  if (query._id.$ne) {
    query._id.$ne = new ObjectId(query._id.$ne);
    return query;
  }
  if (query._id.$nin) {
    for (i = 0; i < query._id.$nin.length; i++) {
      query._id.$nin[i] = new ObjectId(query._id.$nin[i]);
    }
    return query;
  }
  query._id = new ObjectId(query._id);
  return query;
};