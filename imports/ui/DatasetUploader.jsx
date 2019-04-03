import React, { Component } from 'react';
import CSVReader from 'react-csv-reader'
import {Redirect} from 'react-router-dom'
import Dataset from '../api/dataset.js'
import { Random } from 'meteor/random'

export default class DatasetUploader extends Component{
    constructor(){
        super()
        this.state = {
            dataset_id : null
        }
    }

    handleFileLoaded = data => {
        var dataset_id = Random.id()
        for (var i=0; i<data.length; i++){
            for (var j=0; j<data[i].length; j++){ 
              var value = data[i][j]
              Dataset.insert({
                  i,
                  j,
                  value,
                  dataset_id,
                  original:true})
            }
          }
        this.setState({
            dataset_id : dataset_id
        })
        
    };
    render(){
        if (this.state.dataset_id) {
            return <Redirect to={"/dataset/" + this.state.dataset_id} /> 
        }

        return (
            <div>
                <h2> Upload your dataset</h2>
                <CSVReader onFileLoaded={this.handleFileLoaded} />
            </div>
        )
    }
}