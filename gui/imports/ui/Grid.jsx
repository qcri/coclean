import React from 'react';
import { HotTable } from '@handsontable/react';
import { withTracker } from 'meteor/react-meteor-data';
import Dataset from '../api/dataset.js'
import Flag from '../api/flag.js'
import { Meteor } from 'meteor/meteor';
import Handsontable from 'handsontable';
import { _ } from 'meteor/underscore'
import 'handsontable/dist/handsontable.full.css';
import * as CSV from 'csv-string';

class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.refToHotIns=React.createRef();
    window._ = _
  }
  render() {
    var data = JSON.parse(JSON.stringify(this.props.originalData));
    this.props.myUpdates.map((cell) => {
        const i = cell.i,  j = cell.j, value = cell.value 
        data[i][j] = value
    }); 

    const getValuesByOthers = ((i,j) => {
        const vals = this.props.othersUpdates
        return (vals[i] && vals[i][j]) || []
    })

    const isLabeled = ((i,j) => {
        labels = this.props.labels
        return (labels[i] && labels[i][j]) || false
    })

    const getContextMenueItems = ( () => {
        var items = {
            flag:{
                name:'Flag as dirty',
                callback: ((key, selection, clickEvent) => { 
                    const i = selection[0].end.row, j = selection[0].end.col
                    if(!isLabeled(i,j))
                        Flag.insert({i,j, datasetId:this.props.datasetId})
                })
            },
            "sep1": {name: '---------'},
            ValuesFromOtherCollaborators:{
                name: 'Values from other collaborators',
                disabled: true
            }
        }
        for (var c=0; c<10; c++){
            items['value'+c] = 
            {
                name: ((c) =>  {
                    return function (){
                        const values = getValuesByOthers(this.getSelectedLast()[0], this.getSelectedLast()[1])
                        return values[c] ; 
                    }
                })(c),
                hidden:  ((c) =>  {
                    return function (){
                        const values = getValuesByOthers(this.getSelectedLast()[0], this.getSelectedLast()[1])
                        return values.length<=c ; 
                    }
                })(c)
            }
        }
        return items
    })
    
    return (
        <div>
            <h3>Share this dataset with other collaborators: </h3>
            <span> {document.URL}</span>
            <HotTable ref={this.refToHotIns} root={this.refToHotIns} settings={{
                data:data,
                colHeaders:this.props.header,
                rowHeaders:this.props.index,
                width:"1400",
                height:"500",
                manualRowResize: true,
                manualColumnResize: true,
                filters: true,
                dropdownMenu: true,
                allowInsertRow: false,
                allowInsertColumn: false,
                allowRemoveRow: false,
                allowRemoveColumn: false,
                licenseKey:'non-commercial-and-evaluation',
                bindRowsWithHeaders: 'strict',
                contextMenu: {
                    items:getContextMenueItems()
                },
                renderer: function(instance, td, row, col, prop, value, cellProperties) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    // apply style, or better to have class name with external styles
                    if (getValuesByOthers(row,col).length) {
                        td.style.background = 'red';
                    }
                    if (isLabeled(row,col)) {
                        td.style.background = 'yellow';
                    }
                    return td;
                },

                afterChange: (changes) => {
                    if(changes){
                        changes.forEach(([row, prop, oldValue, newValue]) => {
                            if (oldValue !== newValue)
                                Dataset.insert({i:row, j:prop, value:newValue, datasetId:this.props.datasetId})
                        });
                    }
                }
                }} 
            />
        </div>
    );
  }
}

export default withTracker(props =>  {
    datasetId = props.match.params.datasetId
    // TODO: Need to check the existance of the dataset id
    dataset = Dataset.find(new Meteor.Collection.ObjectID(datasetId)).fetch()[0]
    originalData = CSV.parse(dataset.data);
    metadata = dataset.metadata

    Meteor.subscribe('dataset', datasetId);
    ds = Dataset.getDataset(datasetId)
    log = ds.find({}).fetch();
    header = originalData[0].slice(1)
    index = originalData.slice(1).map(e => e[0])
    originalData = originalData.slice(1).map(e => e.slice(1))

    myUpdates = ds.find({
        userId:Meteor.userId(),
        type:'update'
    }, { sort: { createdAt: 1 }
     }).fetch()

    othersUpdates = []
    ds.find({
        userId:{$ne:Meteor.userId()},
        type:'update'
    }).fetch().map((cell) => {
        const i = cell.i,  j = cell.j, value = cell.value 
        this.othersUpdates[i] = this.othersUpdates[i] || []
        this.othersUpdates[i][j] = this.othersUpdates[i][j] || []
    
        if (!this.othersUpdates[i][j].includes(value))
            this.othersUpdates[i][j].push(value)
    });

    labels = []
    ds.find({
        userId:{$ne:Meteor.userId()},
        type:'label'
    }).fetch().map((cell) => {
        const i = cell.i,  j = cell.j
        labels[i] = labels[i] || []
        labels[i][j] = true
    })
            
    return {
        datasetId,
        header,
        index,
        originalData,
        myUpdates,
        othersUpdates,
        labels
    }
})(Grid);
