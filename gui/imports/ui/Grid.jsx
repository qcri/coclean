import React from 'react';
import { HotTable } from '@handsontable/react';
import { withTracker } from 'meteor/react-meteor-data';
import Dataset from '../api/dataset.js'
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

  seq2index(instance, row,col){
        return [
            this.props.index[instance.toPhysicalRow(row)],
            this.props.header[instance.toPhysicalColumn(col)],
        ] 
    }

  render() {
    const seq2index = (...args) => this.seq2index(...args)

    var data = JSON.parse(JSON.stringify(this.props.originalData));
    this.props.myUpdates.map((cell) => {
        const index = cell.index,  column = cell.column, value = cell.new_value
        var row = this.props.index.indexOf(index)
        var col = this.props.header.indexOf(column) 
        data[row][col] = value
    }); 

    const getValuesByOthers = ((index,column) => {
        const vals = this.props.othersUpdates
        return (vals[index] && vals[index][column]) || []
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
                    var index, column
                    [index,column] = seq2index(this, i,j)
                    if(!isLabeled(index, column))
                        Meteor.call('dataset.update', {
                            datasetId, index, column, type:'label', new_value: false
                        }, (err, res) => {
                            if (err) {
                                alert(err);
                            } else {
                                //sucess
                            }
                            });
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
                        var index, column
                        [index,column] = seq2index(this, this.getSelectedLast()[0], this.getSelectedLast()[1])
                        const values = getValuesByOthers(index, column)
                        return values[c] ; 
                    }
                })(c),
                hidden:  ((c) =>  {
                    return function (){
                        var index, column
                        [index,column] = seq2index(this, this.getSelectedLast()[0], this.getSelectedLast()[1])
                        const values = getValuesByOthers(index, column)
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
                renderer: function (instance, td, row, col, prop, value, cellProperties) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    var index, column
                    [index,column] = seq2index(instance, row, col)
                    // apply style, or better to have class name with external styles
                    if (getValuesByOthers(index,column).length) {
                        td.style.background = 'red';
                    }
                    if (isLabeled(index,column)) {
                        td.style.background = 'yellow';
                    }
                    return td;
                },

                afterChange: (changes) => {
                    if(changes){
                        changes.forEach(([row, col, old_value, new_value]) => {
                            if (old_value !== new_value){
                                var index, column
                                [index,column] = seq2index(this.refToHotIns.current.hotInstance, row, col)
                                Meteor.call('dataset.update', {
                                    datasetId, index, column, type:'update', new_value
                                  }, (err, res) => {
                                    if (err) {
                                      alert(err);
                                    } else {
                                      //sucess
                                    }
                                  });
                            }
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
        user_id:Meteor.userId(),
        type:'update'
    }, { sort: { createdAt: 1 }
     }).fetch()

    othersUpdates = []
    ds.find({
        user_id:{$ne:Meteor.userId()},
        type:'update'
    }).fetch().map((cell) => {
        const index = cell.index,  column = cell.column, value = cell.new_value 
        this.othersUpdates[index] = this.othersUpdates[index] || []
        this.othersUpdates[index][column] = this.othersUpdates[index][column] || []
    
        if (!this.othersUpdates[index][column].includes(value))
            this.othersUpdates[index][column].push(value)
    });

    labels = []
    ds.find({
        user_id:{$ne:Meteor.userId()},
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
