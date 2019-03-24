import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

Dataset = new Mongo.Collection('dataset');

Dataset.before.insert(function (userId, doc) {

    if(Meteor.isServer) {
      
      doc.createdAt = Date.now();
      doc.updatedAt = Date.now();
      if (!doc.userId)
        doc.userId = Meteor.userId();
  } 
})

export default Dataset 