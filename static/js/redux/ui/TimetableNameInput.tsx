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

import React, { useState, useEffect, useCallback, useRef } from "react";
import classnames from "classnames";
import { AnyIfEmpty, useSelector } from "react-redux";
import { useActions } from "../hooks";
import { signupModalActions } from "../state/slices/signupModalSlice";
import { RootState } from "../state/index";

/**
 * This is the input field for the timetable name found in the Sidebar. Students can set
 * their timetable name to a non-empty string that doesn't conflict with another
 * timetable name.
 */
const TimetableNameInput = () => {
  // select redux state, same as mapStateToProps
  const isLoggedIn = useSelector((state: RootState) => state.userInfo.data.isLoggedIn);
  const { activeTimetable, upToDate } = useSelector(
    (state: RootState) => state.savingTimetable
  );

  // get actionCreators needed
  const { changeTimetableName } = useActions();

  const [inputValue, setInputValue] = useState(activeTimetable.name);
  const inputRef = useRef(null);

  const setTimetableName = () => {
    if (inputValue.length === 0) {
      setInputValue(activeTimetable.name);
    } else if (inputValue !== activeTimetable.name) {
      changeTimetableName(inputValue);
    }
  };

  const handleEnterKeyPressed = useCallback(
    (e: any) => {
      // save course when user pressed enter
      if (inputRef && e.key === "Enter") {
        setTimetableName();
        inputRef.current?.blur();
      }
    },
    [inputRef]
  );

  useEffect(() => {
    $(document.body).on("keydown", handleEnterKeyPressed);
    return () => {
      $(document.body).off("keydown");
    };
  }, [handleEnterKeyPressed]);

  useEffect(() => {
    setInputValue(activeTimetable.name);
  }, [activeTimetable.name]);

  const showSignupModal = () => {
    if (!isLoggedIn) {
      signupModalActions.showSignupModal();
    }
  };

  const alterTimetableName = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setInputValue(event.target.value);
  };

  return (
    <input
      className={classnames("timetable-name", {
        unsaved: !upToDate,
      })}
      value={inputValue}
      onChange={alterTimetableName}
      onBlur={setTimetableName}
      onClick={showSignupModal}
      ref={inputRef}
    />
  );
};

export default TimetableNameInput;
