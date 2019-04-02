import { Meteor } from 'meteor/meteor';
import React from 'react';
import Grid from './Grid.jsx';
import AccountsUIWrapper from './AccountsUIWrapper.jsx'
import { withTracker } from 'meteor/react-meteor-data';
import { BrowserRouter as Router, Route } from 'react-router-dom'


class App extends React.Component{
  constructor(props){
    super(props)  
  }

  render(){
    return (
      <div>
        <h1>Welcome to the Collaborative Data Cleaning!</h1>
        <AccountsUIWrapper />
          { Meteor.userId() ?
              <Router>
                <Route path="/datasets/:dataset_id" component={Grid} />
              </Router>
              :
              <h1>Please log in first</h1>
          }
      </div>
    )
  }

}

export default withTracker(() => {
  return {
    currentUser: Meteor.userId(),
  };
})(App);