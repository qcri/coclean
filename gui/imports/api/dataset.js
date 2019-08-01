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
    datasets[datasetId] = new Mongo.Collection(datasetId, {idGeneration:'MONGO'});
  }
  return datasets[datasetId]
}

Meteor.methods({
  'dataset.update'({datasetId, index, column, type, new_value}){
    Dataset.getDataset(datasetId).upsert(
        {index, column, 'user_id': Meteor.user_id, type},
        {$set: 
            {index,column, 'user_id': Meteor.userId(), type, new_value}
        }
    )
  }
})

export default Dataset 