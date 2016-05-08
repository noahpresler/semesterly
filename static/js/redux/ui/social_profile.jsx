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
		let divStyle = {
			backgroundImage: 'url(' + this.props.userImg + ')',
		};
    	return(
			<div id="social">
				<div onMouseDown={this.toggleDropdown.bind(this)}>
					<div id="social-pro-pic" style={divStyle}></div>
					<h2>{this.props.userFirstName}</h2>
				</div>
				<div id="social-dropdown"
					className={classNames({'down' : this.props.inRoster})}
					>
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