import React from 'react';
import classnames from 'classnames';

class TermsOfServiceBanner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isVisible: this.props.isVisible };
  }

  componentWillUpdate() {
    this.setState = { isVisible: this.props.isVisible };
  }

  render() {
    return (
      <div
        className={classnames('tos-banner', {
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
        <div className="tos-banner__close" onClick={this.props.dismissTermsOfServiceBanner}>
          <i className="fa fa-times" />
        </div>
      </div>
    );
  }
}

TermsOfServiceBanner.propTypes = {
  isVisible: React.PropTypes.bool.isRequired,
  dismissTermsOfServiceBanner: React.PropTypes.func.isRequired,
};

export default TermsOfServiceBanner;
