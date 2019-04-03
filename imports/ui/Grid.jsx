import React from 'react';
import { HotTable } from '@handsontable/react';
import { withTracker } from 'meteor/react-meteor-data';
import Dataset from '../api/dataset.js'
import { Meteor } from 'meteor/meteor';
import Handsontable from 'handsontable';
import { _ } from 'meteor/underscore'
import 'handsontable/dist/handsontable.full.css';

class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.refToHotIns=React.createRef();
    window._ = _
  }
  render() {
    var dataColne = JSON.parse(JSON.stringify(this.props.originalData));
    this.props.myUpdates.map((cell) => {
        const i = cell.i,  j = cell.j, value = cell.value 
        dataColne[i][j] = value
    }); 

    const getValuesByOthers = ((i,j) => {
        const vals = this.props.othersUpdates
        return (vals[i] && vals[i][j]) || []
    })


    const getContextMenueItems = ( () => {
        var items = {
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
                data:dataColne,
                colHeaders:this.props.header,
                rowHeaders:true,
                width:"1400",
                height:"500",
                manualRowResize: true,
                manualColumnResize: true,
                contextMenu: true,
                filters: true,
                dropdownMenu: true,
                allowInsertRow: false,
                allowInsertColumn: false,
                allowRemoveRow: false,
                allowRemoveColumn: false,
                contextMenu: {
                    items:getContextMenueItems()
                },
                renderer: function(instance, td, row, col, prop, value, cellProperties) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    // apply style, or better to have class name with external styles
                    if (getValuesByOthers(row,col).length) {
                        td.style.background = 'red';
                    }
                    return td;
                },

                licenseKey:'non-commercial-and-evaluation',
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

    originalData = []
    Dataset.find({
        datasetId,
        original:true
    }).fetch().map((cell) => {
        const i = cell.i,  j = cell.j, value = cell.value 
        originalData[i] = originalData[i] || []
        originalData[i][j] = value
    })
    header = originalData[-1]

    myUpdates = Dataset.find({
        datasetId,
        original:{$exists:false},
        userId:Meteor.userId()}, { sort: { createdAt: 1 }
     }).fetch()

    othersUpdates = []
    Dataset.find({
        datasetId,
        original:{$exists:false},
        userId:{$ne:Meteor.userId()}
    }).fetch().map((cell) => {
        const i = cell.i,  j = cell.j, value = cell.value 
        this.othersUpdates[i] = this.othersUpdates[i] || []
        this.othersUpdates[i][j] = this.othersUpdates[i][j] || []
    
        if (!this.othersUpdates[i][j].includes(value))
            this.othersUpdates[i][j].push(value)
    });
            
    return {
        datasetId,
        header,
        originalData,
        myUpdates,
        othersUpdates,
    }
})(Grid);
