import React from 'react';
import { HotTable } from '@handsontable/react';
import { withTracker } from 'meteor/react-meteor-data';
import Dataset from '../api/dataset.js'
import { Meteor } from 'meteor/meteor';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';

class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.refToHotIns=React.createRef();
    this.data = []
  }

  updateData(cell){
    const i = cell.i,  j = cell.j, value = cell.value 
    if (!this.data[i])
        this.data[i] = []

    this.data[i][j] = value
  }

  render() {
    this.props.original.map((cell) => {
        this.updateData(cell)
    }); 
    this.props.myUpdates.map((cell) => {
        this.updateData(cell)
    }); 

    var dirtyCellsByOthers = "";
    this.props.othersUpdates.map((cell) => {
        dirtyCellsByOthers += cell.i + ',' + cell.j + ';'
    });

    return (<HotTable ref={this.refToHotIns} root={this.refToHotIns} settings={{
        data:this.data,
        colHeaders:true,
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
        renderer: function(instance, td, row, col, prop, value, cellProperties) {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
            // apply style, or better to have class name with external styles
            if (dirtyCellsByOthers.indexOf(row + ',' + col + ';') > -1) {
                td.style.background = 'red';
            }
            return td;
        },

        licenseKey:'non-commercial-and-evaluation',
        afterChange: (changes) => {
            if(changes){
                changes.forEach(([row, prop, oldValue, newValue]) => {
                    if (oldValue !== newValue)
                        Dataset.insert({i:row, j:prop, value:newValue})
                });
            }
          }
        }} 
    />);
  }
}

export default withTracker(() => {
    const original = Dataset.find({original:{$eq:true}}).fetch()
    const myUpdates = Dataset.find({userId: {$eq:Meteor.userId()}}, { sort: { createdAt: 1 } }).fetch()
    const othersUpdates = Dataset.find({userId:{$exists:true, $ne:Meteor.userId()}}).fetch()
   
    return {
        original,
        myUpdates,
        othersUpdates,
    }
})(Grid);
