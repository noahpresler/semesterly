import React from 'react';
import classNames from 'classnames';
import ClickOutHandler from 'react-onclickout';
import * as PropTypes from '../constants/propTypes';

class SocialProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showDropdown: false };
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.hideDropDown = this.hideDropDown.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
  }

  toggleDropdown() {
    this.setState({ showDropdown: !this.state.showDropdown });
  }

  hideDropDown() {
    this.setState({ showDropdown: false });
  }

  render() {
    const profileImage = {
      backgroundImage: `url(${this.props.userInfo.img_url})`,
    };
    const loggedIn = (
      <ClickOutHandler onClickOut={this.hideDropDown}>
        <div>
          <div onMouseDown={this.toggleDropdown}>
            <div id="social-pro-pic" style={profileImage} />
            <h2>{this.props.userInfo.userFirstNam}</h2>
            <span className={classNames('tip-down', { down: this.state.showDropdown })} />
          </div>
          <div
            id="social-dropdown"
            className={classNames({ down: this.state.showDropdown })}
          >
            <div className="tip-border" />
            <div className="tip" />
            <a onClick={this.props.showUserSettings}>
              <i className="fa fa-cog" />
              <span>Account</span>
            </a>
            <a href="/me">
              <i className="fa fa-bar-chart" />
              <span>Stats</span>
            </a>
            <a href="/static/privacypolicy.htm">
              <i className="fa fa-user-secret" />
              <span>Privacy</span>
            </a>
            <a href="/user/logout/">
              <i className="fa fa-sign-out" aria-hidden="true" />
              <span>Sign out</span>
            </a>
          </div>
        </div>
      </ClickOutHandler>

        );
    const loggedOut = (
      <a id="social-login" onClick={() => this.props.triggerAcquisitionModal()}>
        <h2>
          <span>Signup/Login</span>
          <span className="mobile">Signup Login</span>
        </h2>
      </a>
        );
    const social = this.props.userInfo.isLoggedIn ? loggedIn : loggedOut;
    return (
      <div
        id="social"
        className={classNames({ 'logged-in': this.props.userInfo.isLoggedIn }, 'no-print')}
      >
        {social}
      </div>
    );
  }
}

SocialProfile.propTypes = {
  userInfo: PropTypes.userInfo.isRequired,
  showUserSettings: React.PropTypes.func.isRequired,
  triggerAcquisitionModal: React.PropTypes.func.isRequired,
};

export default SocialProfile;
