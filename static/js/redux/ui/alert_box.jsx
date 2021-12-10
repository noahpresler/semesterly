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
import EventEmitter from 'events';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import Alert from './alert';

class AlertBox extends React.Component {
  /**
   * Generate a key
   * @return {string}
   */
  static genUniqueKey() {
    return new Date().getTime().toString() + Math.random().toString(36).substr(2, 5);
  }

  constructor(props) {
    super(props);
    global.reactAlertEvents = new EventEmitter();
    this.state = {
      alerts: [],
    };
    this.style = this.setStyle();
    this.theme = this.setTheme();
    this.eventListeners();
  }

  componentDidUpdate() {
    this.style = this.setStyle();
    this.theme = this.setTheme();
  }

  /**
     * Set the alert position on the page
     */
  setStyle() {
    let position = {};
    switch (this.props.position) {
      case 'top left':
        position = {
          top: -10,
          right: 'auto',
          bottom: 'auto',
          left: 0,
        };
        break;
      case 'top right':
        position = {
          top: 0,
          right: 0,
          bottom: 'auto',
          left: 'auto',
        };
        break;
      case 'bottom left':
        position = {
          top: 'auto',
          right: 'auto',
          bottom: 0,
          left: 0,
        };
        break;
      default:
        position = {
          top: 'auto',
          right: 0,
          bottom: 0,
          left: 'auto',
        };
        break;
    }

    return {
      margin: `${this.props.offset}px`,
      top: position.top,
      right: position.right,
      bottom: position.bottom,
      left: position.left,
    };
  }

  /**
     * Set the style of the alert based on the chosen theme
     */
  setTheme() {
    let theme = {};
    switch (this.props.theme) {
      case 'light':
        theme = {
          alert: {
            backgroundColor: '#fff',
            color: '#333',
          },
          closeButton: {
            bg: '#f3f3f3',
          },
        };
        break;
      default:
        theme = {
          alert: {
            backgroundColor: '#333',
            color: '#fff',
          },
          closeButton: {
            bg: '#696969',
          },
        };
        break;
    }

    return theme;
  }

  /**
   * Listen to alert events
   * @return {void}
   */
  eventListeners() {
    reactAlertEvents.on('ALERT.REMOVE', (alert) => {
      this.setState({ alerts: this.removeAlert(alert) });
    });
  }

  /**
   * Show the alert in the page
   * @param  {string} message
   * @param  {Object} options
   * @return {void}
   */
  show(message, options = {}) {
    let alert = {};
    alert.message = message;
    alert = Object.assign(alert, options);
    this.setState({ alerts: this.addAlert(alert) });
  }

  /**
   * Show the alert in the page with info type
   * @param  {string} message
   * @param  {Object} options
   * @return {void}
   */
  info(message, options = {}) {
    const newOptions = Object.assign({}, options);
    newOptions.type = 'info';
    this.show(message, newOptions);
  }


  /**
   * Show the alert in the page with error type
   * @param  {string} message
   * @param  {Object} options
   * @return {void}
   */
  error(message, options = {}) {
    const newOptions = Object.assign({}, options);
    newOptions.type = 'error';
    this.show(message, newOptions);
  }

  /**
   * Show the alert in the page with success type
   * @param  {string} message
   * @param  {Object} options
   * @return {void}
   */
  success(message, options = {}) {
    const newOptions = Object.assign({}, options);
    newOptions.type = 'success';
    this.show(message, newOptions);
  }

  /**
   * Remove all tasks from the page
   * @return {void}
   */
  removeAll() {
    this.setState({ alerts: [] });
  }

  /**
   * Add an alert
   * @param {Object} alert
   */
  addAlert(alert) {
    const newAlert = Object.assign({}, alert);
    newAlert.uniqueKey = AlertBox.genUniqueKey();
    newAlert.style = this.theme;
    if (!Object.prototype.hasOwnProperty.call(newAlert, 'time')) {
      newAlert.time = this.props.time;
    }

    newAlert.closeIconClass = `close-${this.props.theme}`;
    return this.state.alerts.concat([newAlert]);
  }

  /**
   * Remove an Alert from the container
   * @param  {Alert} alert
   * @return {void}
   */
  removeAlert(alert) {
    return this.state.alerts.filter(a => a.uniqueKey !== alert.props.uniqueKey);
  }

  render() {
    return (
      <div style={this.style} className="react-alerts">
        <ReactCSSTransitionGroup
          transitionName={this.props.transition}
          transitionEnterTimeout={250}
          transitionLeaveTimeout={250}
        >
          {this.state.alerts.map(alert => (<Alert
            key={alert.uniqueKey}
            {...alert}
          />))}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

AlertBox.defaultProps = {
  offset: 14,
  position: 'top right',
  theme: 'light',
  time: 5000,
  transition: 'scale',
};

AlertBox.propTypes = {
  offset: PropTypes.number,
  position: PropTypes.oneOf([
    'bottom left',
    'bottom right',
    'top right',
    'top left',
  ]),
  theme: PropTypes.oneOf(['dark', 'light']),
  time: PropTypes.number,
  transition: PropTypes.oneOf(['scale', 'fade']),
};

export default AlertBox;

