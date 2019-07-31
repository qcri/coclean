import { Meteor } from 'meteor/meteor';
import Dataset from '/imports/api/dataset';


Meteor.startup(() => {
  // Any initializtion logic on server side
  
});

Meteor.publish('dataset', function(datasetId) {
  // TODO: Need to check the exsistance of the dataset id
  return Dataset.getDataset(datasetId).find({});
});