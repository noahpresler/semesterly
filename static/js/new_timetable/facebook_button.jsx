module.exports = React.createClass({

    getInitialState: function() {
       return {connected: false};
     },

   componentDidMount: function() {
     window.fbAsyncInit = function() {
       FB.init({
         appId      : '580022102164877',
         cookie     : true,  // enable cookies to allow the server to access the session
         xfbml      : true,  // parse social plugins on this page
         version    : 'v2.5' // use version 2.5
       });
       FB.getLoginStatus(function(response) {
         this.statusChangeCallback(response);
       }.bind(this));
     }.bind(this);

     // Load the SDK asynchronously
     (function(d, s, id) {
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) return;
       js = d.createElement(s); js.id = id;
       js.src = "//connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));
   },


   testAPI: function() {
     FB.api('/me/friends', function(response) {
         console.log('Friends installed: ');
         console.log(response);
     });
     FB.api('/me?fields=id,name,email,permissions', function(response) {
         console.log('User Info: ');
         console.log(response);
     });
   },

   statusChangeCallback: function(response) {
      connected = response.status == 'connected' ? true : false
      if (connected) {
         this.testAPI()
      }
      this.setState({connected: connected});
   },

   checkLoginState: function() {
     FB.getLoginStatus(function(response) {
       this.statusChangeCallback(response);
     }.bind(this));
   },

   handleClick: function() {
     if (this.state.connected) {
      FB.logout(function(response) {
         this.statusChangeCallback(response)
      }.bind(this));
     }
     else {
      FB.login(function(response) {
         this.statusChangeCallback(response)
      }.bind(this),{scope: 'email,user_friends'});
     }
   },

   render: function() {
      var ButtonText = this.state.connected ? "Logout" : "Login";
      return (<div onClick={this.handleClick}>{ButtonText}</div>)
  },

});
