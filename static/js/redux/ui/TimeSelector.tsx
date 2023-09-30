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

import React, { useEffect } from "react";
import InputRange from "react-input-range";

type FilterData = { min: number; max: number };

interface TimeSelectorProps {
  day: string;
  value: FilterData;
  onChange: (value: FilterData) => void;
  remove: (day: string) => void;
  onChangeComplete?: (value: FilterData) => void;
}

/**
 * This component is used in the AdvancedSearchModal to select the time range a class
 * must take place in.
 */
const TimeSelector = (props: TimeSelectorProps) => {
  const { day, value, onChange, onChangeComplete, remove } = props;

  useEffect(() => {
    $(".input-range__label-container")
      .filter((i) => i % 2 === 0)
      .addClass("input-range__label--max-time");
  }, []);

  return (
    <div className="time-selector">
      <InputRange
        maxValue={24}
        minValue={8}
        value={value}
        step={0.5}
        formatLabel={(v) => {
          const hour = Math.floor(v);
          const minute = (v % 1) * 60;
          return `${hour}:${minute === 0 ? "00" : minute}`;
        }}
        onChange={onChange}
        onChangeComplete={onChangeComplete}
      />
      <div className="time-selector-day">
        <div style={{ marginRight: "2px" }}>{day.slice(0, 3)}</div>
        <i className="fa fa-times" onClick={() => remove(day)} />
      </div>
    </div>
  );
};

export default TimeSelector;
