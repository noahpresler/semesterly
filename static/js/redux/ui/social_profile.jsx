import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

export class SocialProfile extends React.Component {
    constructor(props){
        super(props);
        this.state = {showDropdown: false};
        this.toggleDropdown = this.toggleDropdown.bind(this);
    }
    toggleDropdown() {
    	this.setState({showDropdown: !this.state.showDropdown});
    }
    render() {
		let profileImage = {
			backgroundImage: 'url(' + this.props.userImg + ')',
		};
		let blankImage = {
			backgroundImage: 'url(/static/img/blank.jpg)',
		};
		let loggedIn = (
			<div>
				<div onMouseDown={this.toggleDropdown.bind(this)}>
					<div id="social-pro-pic" style={profileImage}></div>
					<h2>{this.props.userFirstName}</h2>
				</div>
				<div id="social-dropdown"
					className={classNames({'down' : this.state.showDropdown})}
					>
					<div className="tip-border"></div>
					<div className="tip"></div>
					<a href="/user/logout">
						<i className="fa fa-sign-out"></i>
						<span>Sign out</span>
					</a>
				</div>
			</div>
		);
		let loggedOut = (
			<a id="social-login" href="/login/facebook">
				<h2>Signup/Login <i className="fa fa-facebook-square"></i></h2>
			</a>
		);
		let social = this.props.isLoggedIn ? loggedIn : loggedOut;
    	return(
			<div id="social">
				{social}
			</div>
		);
    }
}