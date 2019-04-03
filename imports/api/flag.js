import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

Flag = new Mongo.Collection('flag');

Flag.before.insert(function (userId, doc) {
    if (Meteor.isClient)
        doc.userId = Meteor.userId();
        
    if(Meteor.isServer) {
      doc.createdAt = Date.now();
      doc.updatedAt = Date.now();
  } 
})

export default Flag