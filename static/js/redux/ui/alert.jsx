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

import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';

class Alert extends React.Component {
  constructor(props) {
    super(props);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.showIcon = this.showIcon.bind(this);
  }

  componentDidMount() {
    if (this.props.time > 0) {
      this.countdown();
    }
  }

    /**
     * Include the given icon or use the default one
     * @return {React.Component}
     */
  showIcon() {
    const icon = this.props.icon || <div className={`${this.props.type}-icon`} />;
    return icon;
  }

    /**
     * Remove the alert after the given time
     * @return {void}
     */
  countdown() {
    setTimeout(() => {
      this.removeSelf();
    }, this.props.time);
  }

    /**
     * Emit a event to AlertContainer remove this alert from page
     * @return {void}
     */
  removeSelf() {
    reactAlertEvents.emit('ALERT.REMOVE', this);
  }

  /**
   * Handle the close button click
   * @return {void}
   */
  handleCloseClick() {
    this.removeSelf();
  }

  render() {
    return (
      <div
        style={this.props.style.alert}
        className={classnames('alert', this.props.type, this.props.additionalClass)}
      >
        <div className="content icon">
          {this.showIcon()}
        </div>
        <div className="content message">
          {this.props.message}
        </div>
        <div
          onClick={this.handleCloseClick}
          style={{
            backgroundColor: this.props.style.closeButton.bg,
          }}
          className="content close"
        >
          <div className={this.props.closeIconClass} />
        </div>
      </div>
    );
  }
}

Alert.defaultProps = {
  additionalClass: '',
  icon: '',
  message: '',
  type: 'info',
  style: {
    alert: {},
    closeButton: {},
  },
};

Alert.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'error']),
  closeIconClass: PropTypes.string.isRequired,
  additionalClass: PropTypes.string.isRequired,
  style: PropTypes.shape({
    alert: PropTypes.style,
    closeButton: PropTypes.style,
  }),
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  time: PropTypes.number.isRequired,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};

export default Alert;

