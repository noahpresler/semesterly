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

class TextInput extends React.Component {
  constructor(props) {
    super(props);
    // this.alterTimetableName = this.alterTimetableName.bind(this);
    // this.setTimetableName = this.setTimetableName.bind(this);
    this.showSignupModal = this.showSignupModal.bind(this);
    this.state = { name: this.props.activeLoadedTimetableName };
  }

  componentWillMount() {
    $(document.body).on('keydown', (e) => {
      if (e.key === 'Enter') {
        // this.setTimetableName();
        $('input.timetable-name').blur();
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ name: nextProps.activeLoadedTimetableName });
  }

  showSignupModal() {
    if (!this.props.isLoggedIn) {
      this.props.openSignUpModal();
    }
  }

  // TODO:
  sendContent(event) {
    this.setState({ name: event.target.value });
  }

  render() {
    return (<input />);
  }
}

TextInput.propTypes = {
  openSignUpModal: PropTypes.func.isRequired,
  activeLoadedTimetableName: PropTypes.string.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
};


export default TextInput;

