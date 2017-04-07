import React from "react";
import classNames from "classnames";
import ClickOutHandler from "react-onclickout";

export class SocialProfile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {showDropdown: false};
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.hideDropDown = this.hideDropDown.bind(this);
    }

    toggleDropdown() {
        this.setState({showDropdown: !this.state.showDropdown});
    }

    hideDropDown() {
        this.setState({showDropdown: false});
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
                        <span className={classNames("tip-down", {'down': this.state.showDropdown})}></span>
                    </div>
                    <div id="social-dropdown"
                         className={classNames({'down': this.state.showDropdown})}
                    >
                        <div className="tip-border"></div>
                        <div className="tip"></div>
                        <a onClick={this.props.showUserSettings}>
                            <i className="fa fa-cog"></i>
                            <span>Account</span>
                        </a>
                        <a href="/me">
                            <i className="fa fa-bar-chart"></i>
                            <span>Stats</span>
                        </a>
                        <a href="/static/privacypolicy.htm">
                            <i className="fa fa-user-secret"></i>
                            <span>Privacy</span>
                        </a>
                        <a href="/user/logout/">
                            <i className="fa fa-sign-out" aria-hidden="true"></i>
                            <span>Sign out</span>
                        </a>
                    </div>
                </div>
            </ClickOutHandler>

        );
        let loggedOut = (
            <a id="social-login" onClick={() => this.props.triggerAcquisitionModal() }>
                <h2>
                    <span>Signup/Login</span>
                    <span className="mobile">Signup Login</span>
                </h2>
            </a>
        );
        let social = this.props.userInfo.isLoggedIn ? loggedIn : loggedOut;
        return (
            <div id="social"
                 className={classNames({'logged-in': this.props.userInfo.isLoggedIn}, "no-print")}>
                {social}
            </div>
        );
    }
}
