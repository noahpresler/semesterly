import React from 'react';
import ReactDOM from 'react-dom';

export class SocialProfile extends React.Component {
    render() {
		let divStyle = {
			backgroundImage: 'url(' + this.props.userImg + ')',
		};
    	return(
			<div id="social">
				<div id="social-pro-pic" style={divStyle}></div>
				<h2>{this.props.userFirstName}</h2>
				<div id="social-dropdown">
					<div className="tip-border"></div>
					<div className="tip"></div>
					<li>
						<i className="fa fa-sign-out"></i>
						<span>Sign out</span>
					</li>
				</div>
			</div>);
    }
}