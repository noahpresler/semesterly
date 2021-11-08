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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import classnames from 'classnames';

const TimetableNameInput = (props) => {
  const [activeLoadedTimetableName, setActiveLoadedTimetableName]
    = useState(props.activeLoadedTimetableName);
  const inputRef = useRef();

  const setTimetableName = () => {
    const newName = activeLoadedTimetableName;
    if (newName.length === 0) {
      setActiveLoadedTimetableName(props.activeLoadedTimetableName);
    } else if (newName !== props.activeLoadedTimetableName) {
      props.changeTimetableName(newName);
    }
  };

  const handleEnterKeyPressed = useCallback((e) => {
    // save course when user pressed enter
    if (inputRef && e.key === 'Enter') {
      setTimetableName();
      inputRef.current.blur();
    }
  });

  useEffect(() => {
    $(document.body).on('keydown', handleEnterKeyPressed);
    return () => {
      $(document.body).off('keydown');
    };
  }, [handleEnterKeyPressed]);

  useEffect(() => {
    setActiveLoadedTimetableName(props.activeLoadedTimetableName);
  }, [props.activeLoadedTimetableName]);


  const showSignupModal = () => {
    if (!props.isLoggedIn) {
      props.openSignUpModal();
    }
  };

  const alterTimetableName = (event) => {
    setActiveLoadedTimetableName(event.target.value);
  };

  return (<input
    className={classnames('timetable-name', { unsaved: !props.upToDate })}
    value={activeLoadedTimetableName}
    onChange={alterTimetableName}
    onBlur={setTimetableName}
    onClick={showSignupModal}
    ref={inputRef}
  />);
};

TimetableNameInput.propTypes = {
  activeLoadedTimetableName: PropTypes.string.isRequired,
  openSignUpModal: PropTypes.func.isRequired,
  upToDate: PropTypes.bool.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  changeTimetableName: PropTypes.func.isRequired,
};


export default TimetableNameInput;

