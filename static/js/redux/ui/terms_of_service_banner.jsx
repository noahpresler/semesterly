/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import React from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

class TermsOfServiceBanner extends React.Component {
  constructor(props) {
    super(props);
    this.timer = null;
  }

  componentDidMount() {
    this.timer = setTimeout(() => {
      this.props.dismissTermsOfServiceBanner();
      clearTimeout(this.timer);
    }, 10000);
  }

  render() {
    return (
      <div
        className={classnames("tos-banner", {
          show: this.props.isVisible,
        })}
      >
        <p>
          By using Semester.ly you agree to our
          <a href="/termsofservice" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>
          and
          <a href="/privacypolicy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </p>
        <div
          className="tos-banner__close"
          onClick={this.props.dismissTermsOfServiceBanner}
        >
          <i className="fa fa-times" />
        </div>
      </div>
    );
  }
}

TermsOfServiceBanner.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  dismissTermsOfServiceBanner: PropTypes.func.isRequired,
};

export default TermsOfServiceBanner;
