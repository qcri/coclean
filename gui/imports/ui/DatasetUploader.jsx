import React, { Component } from 'react';
import CSVReader from 'react-csv-reader'
import {Redirect} from 'react-router-dom'
import Dataset from '../api/dataset.js'

export default class DatasetUploader extends Component{
    constructor(){
        super()
        this.state = {
            datasetId : null
        }
    }

    handleFileLoaded = data => {
        var d = ""
        for (var i=0; i<data.length; i++){
            if (i>0)
                d += i-1
                
            d+=","
            for (var j=0; j<data[i].length; j++){ 
                var value = data[i][j]
                d+= value
                if (j<data[i].length - 1)
                    d+=','
                else 
                    d+='\n'
            }
        }
        var datasetId = Dataset.insert({
            metadata: {},
            data: d
        })
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