import React from 'react';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { withTracker } from 'meteor/react-meteor-data';
import Dataset from '../api/dataset.js'


import Handsontable from "handsontable";
import 'handsontable/dist/handsontable.full.css';

class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.data = []
  }

  render() {
    
    this.props.dataset.map((cell) => {
        if (!this.data[cell.i])
            this.data[cell.i] = []

        this.data[cell.i][cell.j] = cell.value
        
        
    });
    return (<HotTable settings={{
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

        licenseKey:'non-commercial-and-evaluation',
        afterChange: (changes) => {
            if(changes){
                changes.forEach(([row, prop, oldValue, newValue]) => {
                    Dataset.insert({i:row, j:prop, value:newValue})
                });
            }
          }
        }} 

    />);
  }
}


export default withTracker(() => {
  return {
    dataset: Dataset.find({}, { sort: { createdAt: 1 } }).fetch(),
  };
})(Grid);
