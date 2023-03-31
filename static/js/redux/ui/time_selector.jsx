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

import PropTypes from "prop-types";
import React from "react";
import InputRange from "react-input-range";

/**
 * This component is used in the AdvancedSearchModal to select the time range a class
 * must take place in.
 */
class TimeSelector extends React.Component {
  componentDidMount() {
    $(".input-range__label-container")
      .filter((i) => i % 2 === 0)
      .addClass("input-range__label--max-time");
  }

  render() {
    const { day, value, onChange, onChangeComplete, remove } = this.props;
    return (
      <div className="time-selector">
        <InputRange
          day={day}
          maxValue={24}
          minValue={8}
          value={value}
          onChange={onChange}
          onChangeComplete={onChangeComplete}
        />
        <div className="time-selector-day">
          <div style={{ marginRight: "2px" }}>{day.slice(0, 3)}</div>
          <i className="fa fa-times" onClick={() => remove(day)} />
        </div>
      </div>
    );
  }
}

TimeSelector.propTypes = {
  day: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onChangeComplete: PropTypes.func.isRequired,
  remove: PropTypes.func.isRequired,
  value: PropTypes.shape({
    max: PropTypes.number.isRequired,
    min: PropTypes.number.isRequired,
  }).isRequired,
};

export default TimeSelector;
