/**
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
**/

import { connect } from 'react-redux';
import Cell from '../calendar_cell';
import { addCustomSlot, updateCustomSlot } from '../../actions/timetable_actions';
import { getMaxEndHour } from '../../util';

const mapStateToProps = (state) => {
  const timetables = state.timetables.items;
  const active = state.timetables.active;
  const hasTimetables = timetables[active].courses.length > 0;
  return {
    endHour: getMaxEndHour(timetables[active], hasTimetables),
  };
};

const CellContainer = connect(
    mapStateToProps,
  {
    addCustomSlot,
    updateCustomSlot,
  },
)(Cell);

export default CellContainer;
