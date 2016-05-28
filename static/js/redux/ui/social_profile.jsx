import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import ClickOutHandler from 'react-onclickout';

export class SocialProfile extends React.Component {
    constructor(props){
        super(props);
        this.state = { showDropdown: false };
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.hideDropDown = this.hideDropDown.bind(this);
    }
    toggleDropdown() {
    	this.setState({ showDropdown: !this.state.showDropdown });
    }
    hideDropDown() {
    	this.setState({ showDropdown: false });
    }
    render() {
		let profileImage = {
			backgroundImage: 'url(' + this.props.userInfo.img_url + ')',
		};
		let blankImage = {
			backgroundImage: 'url(/static/img/blank.jpg)',
		};
		let loggedIn = (
			<ClickOutHandler onClickOut={this.hideDropDown}>
				<div>
					<div onMouseDown={this.toggleDropdown.bind(this)}>
						<div id="social-pro-pic" style={profileImage}></div>
						<h2>{this.props.userInfo.userFirstNam}</h2>
						<span className={classNames("tip-down", {'down' : this.state.showDropdown})}></span>
					</div>
					<div id="social-dropdown"
						className={classNames({'down' : this.state.showDropdown})}
						>
						<div className="tip-border"></div>
						<div className="tip"></div>
						<a onClick={this.props.showUserSettings}>
							<i className="fa fa-cog"></i>
							<span>Account</span>
						</a>
						<a href="/user/logout">
							<i className="fa fa-sign-out"></i>
							<span>Sign out</span>
						</a>
					</div>
				</div>
			</ClickOutHandler>

		);
		let loggedOut = (
			<a id="social-login" href="/login/facebook">
				<h2>Signup/Login <i className="fa yfa-facebook-square"></i></h2>
			</a>
		);
		let social = this.props.userInfo.isLoggedIn ? loggedIn : loggedOut;
    	return(
			<div id="social">
				{social}
			</div>
		);
    }
}
