import { Meteor } from 'meteor/meteor';
import Dataset from '/imports/api/dataset';


Meteor.startup(() => {
  // If the Dataset collection is empty, add some data.
  if (Dataset.find().count() === 0) {
    
    
    var csv = Assets.getText('fodors_1.csv');
    var data = Papa.parse(csv).data;
    var dataset_id = 'abcdef'

    for (i=0; i<data.length; i++){
      for (j=0; j<data[i].length; j++){ 
        value = data[i][j]
        Dataset.insert({i,j,value,dataset_id,original:true})
      }
    }
  }
});
