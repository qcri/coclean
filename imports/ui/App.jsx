import { Meteor } from 'meteor/meteor';
import React from 'react';
import Grid from './Grid.jsx';
import AccountsUIWrapper from './AccountsUIWrapper.jsx'
import { withTracker } from 'meteor/react-meteor-data';


class App extends React.Component{
  constructor(props){
    super(props)
  }

  render(){
    return (
      <div>
        <h1>Welcome to the Collaborative Data Cleaning!</h1>
        <AccountsUIWrapper />
        { Meteor.userId() ?  <Grid userId={Meteor.userId()}/> :  <h1>Please log in first</h1>}
        
      </div>
    )
  }

}

export default withTracker(() => {
  return {
    currentUser: Meteor.userId(),
  };
})(App);