import React from 'react';
import classnames from 'classnames';

class TermsOfServiceBanner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isVisible: this.props.isVisible };
    this.dismissBanner = this.dismissBanner.bind(this);
  }

  componentDidUpdate() {
    this.setState = { isVisible: this.props.isVisible };
  }

  dismissBanner() {
    this.setState = { isVisible: false };
  }

  render() {
    return (
      <div
        className={classnames('tos-banner', {
          show: this.state.isVisible,
        })}
      >
        <p>
          By using Semester.ly you agree to our
          <a href="/static/termsofservice.html" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>
          and
          <a href="/static/privacypolicy.html" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </p>
        <div className="tos-banner__close" onClick={this.dismissSelf}>
          <i className="fa fa-times" />
        </div>
      </div>
    );
  }
}

TermsOfServiceBanner.propTypes = {
  isVisible: React.PropTypes.bool.isRequired,
};

export default TermsOfServiceBanner;
