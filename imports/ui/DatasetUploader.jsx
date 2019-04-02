import React, { Component } from 'react';
import CSVReader from 'react-csv-reader'
import {Redirect} from 'react-router-dom'

export default class DatasetUploader extends Component{
    constructor(){
        super()
        this.state = {
            dataset_id : null
        }
    }

    handleFileLoaded = data => {
        console.log(data);
        this.setState({
            dataset_id : 'abcdef'
        })
        
    };
    render(){
        if (this.state.dataset_id) {
            return <Redirect to="/dataset/abcdef" /> 
        }

        return <CSVReader
                onFileLoaded={this.handleFileLoaded}
                />
    }
}