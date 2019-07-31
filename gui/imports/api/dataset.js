import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

Dataset = new Mongo.Collection('datasets');

Dataset.before.insert(function (userId, doc) {
    if (Meteor.isClient)
        doc.userId = Meteor.userId();
        
    if(Meteor.isServer) {
      doc.createdAt = Date.now();
      doc.updatedAt = Date.now();
  } 
}) 

const datasets = {}

Dataset.getDataset = function (datasetId){
  // TODO: Need to check the existance of the dataset id
  if (! (datasetId in datasets)){
    datasets[datasetId] = new Mongo.Collection(datasetId);
  }
  return datasets[datasetId]
}

export default Dataset 