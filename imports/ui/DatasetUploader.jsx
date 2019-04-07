import React, { Component } from 'react';
import CSVReader from 'react-csv-reader'
import {Redirect} from 'react-router-dom'
import Dataset from '../api/dataset.js'
import { Random } from 'meteor/random'

export default class DatasetUploader extends Component{
    constructor(){
        super()
        this.state = {
            datasetId : null
        }
    }

    handleFileLoaded = data => {
        var datasetId = Random.id()
        for (var i=0; i<data.length; i++){
            for (var j=0; j<data[i].length; j++){ 
              var value = data[i][j]
              Dataset.insert({
                  i: (i-1),   // to account for column headers
                  j,
                  value,
                  datasetId,
                  original:true})
            }
          }
        this.setState({
            datasetId
        })
        
    };
    render(){
        if (this.state.datasetId) {
            return <Redirect to={"/dataset/" + this.state.datasetId} /> 
        }

        return (
            <div>
                <h2> Upload your dataset</h2>
                <label>
                    Work Assignment Policy:
                    <input type="text" name="work_assignment" defaultValue='Min 3 collaborators'/>
                </label>
                <br/>
                <label>
                    Conflict Resolution Policy:
                    <input type="text" name="conflict_resolution" defaultValue='Min 3 collaborators'/>
                </label>
                <CSVReader onFileLoaded={this.handleFileLoaded} />
            </div>
        )
    }
}