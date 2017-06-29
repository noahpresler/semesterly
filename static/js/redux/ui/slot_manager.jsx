import PropTypes from 'prop-types';
import React from 'react';
import { index as IntervalTree, matches01 as getIntersections } from 'static-interval-tree';
import Slot from './slot';
import CustomSlot from './custom_slot';
import { getNextAvailableColour } from '../util';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

class SlotManager extends React.Component {

  static getMinutes(timeString) {
    const l = timeString.split(':');
    return ((+l[0]) * 60) + (+l[1]);
  }

  static getConflictStyles(slotsByDay) {
    const styledSlotsByDay = slotsByDay;
    Object.keys(styledSlotsByDay).forEach((day) => {
      const daySlots = styledSlotsByDay[day];
      // sort by start time
      daySlots.sort((a, b) => SlotManager.getMinutes(a.time_start)
        - SlotManager.getMinutes(b.time_start));

      // build interval tree corresponding to entire slot
      const intervals = daySlots.map((slot, index) => ({
        start: SlotManager.getMinutes(slot.time_start),
        end: SlotManager.getMinutes(slot.time_end),
        id: index, // use day_slot index to map back to the slot object
      }));
      // build interval tree with part of slot that should not be overlayed (first hour)
      const infoIntervals = intervals.map(s => ({
        start: s.start,
        end: Math.min(s.start + 59, s.end),
        id: s.id,
      }));
      const infoSlots = IntervalTree(infoIntervals);

      // bit map to store if slot has already been processed
      const seen = daySlots.map(() => false);

      // bit map to store if slot has already been added to queue
      const added = daySlots.map(() => false);

      // get num_conflicts
      for (let i = 0; i < infoIntervals.length; i++) {
        if (!seen[i]) { // if not seen, perform dfs search on conflicts
          const directConflicts = [];
          const frontier = [infoIntervals[i]];
          while (frontier.length > 0) {
            const next = frontier.pop();
            seen[next.id] = true;
            added[next.id] = true;
            directConflicts.push(next);
            const neighbors = getIntersections(infoSlots, next);
            for (let k = 0; k < neighbors.length; k++) {
              if (!seen[neighbors[k].id] && !added[neighbors[k].id]) {
                frontier.push(neighbors[k]);
                added[neighbors[k].id] = true;
              }
            }
          }
          directConflicts.sort((a, b) => (intervals[b.id].end - intervals[b.id].start) -
          (intervals[a.id].end - intervals[a.id].start));
          for (let j = 0; j < directConflicts.length; j++) {
            const slotId = directConflicts[j].id;
            daySlots[slotId].num_conflicts = directConflicts.length;
            daySlots[slotId].shift_index = j;
          }
        }
      }

      // get shift index
      // build interval tree with part of slot that should not be overlayed
      const overSlots = IntervalTree(intervals.filter(s => s.end - s.start > 60).map(s => ({
        start: s.start + 60,
        end: s.end,
        id: s.id,
      })));
      // get depth_level
      for (let i = 0; i < infoIntervals.length; i++) {
        const conflicts = getIntersections(overSlots, infoIntervals[i]);
        conflicts.sort((a, b) => (b.start - a.start));
        daySlots[i].depth_level = conflicts.length > 0 ?
          daySlots[conflicts[0].id].depth_level + 1 : 0;
      }

      // get exists_conflict
      const completeSlots = IntervalTree(intervals);
      for (let i = 0; i < intervals.length; i++) {
        daySlots[i].exists_conflict = getIntersections(completeSlots, intervals[i]).length > 1;
      }

      styledSlotsByDay[day] = daySlots;
    });
    return styledSlotsByDay;
  }

  getSlotsByDay() {
    const slotsByDay = {
      M: [], T: [], W: [], R: [], F: [],
    };
    const slots = this.props.slots;

    // TODO: don't render slot of the save section type and course as the hovered slot
    slots.forEach((slot) => {
      const { course, section, offerings } = slot;
      offerings.forEach((offering) => {
        // will only be undefined for hovered slot
        const colourId = this.props.courseToColourIndex[course.id] ||
                         getNextAvailableColour(this.props.courseToColourIndex);
        const displayOffering = {
          ...offering,
          colourId,
          courseId: course.id,
          code: course.code,
          name: course.name,
          custom: false,
          meeting_section: section.meeting_section,
        };
        if (displayOffering.day in slotsByDay) { // some offerings have a weekend day (sat or sun)
          slotsByDay[displayOffering.day].push(displayOffering);
        }
      });
    });

    // custom slots
    for (let i = 0; i < this.props.custom.length; i++) {
      const customSlot = this.props.custom[i];
      customSlot.custom = true;
      customSlot.key = customSlot.id;
      slotsByDay[customSlot.day].push(customSlot);
    }
    return SlotManager.getConflictStyles(slotsByDay);
  }

  render() {
    const slotsByDay = this.getSlotsByDay();
    const allSlots = this.props.days.map((day, i) => {
      const daySlots = slotsByDay[day].map((slot, j) => {
        const courseId = slot.courseId;
        const locked = this.props.isLocked(courseId, slot.meeting_section);
        const isOptional = this.props.isCourseOptional(courseId);
        const optionalCourse = isOptional ? this.props.getOptionalCourseById(courseId) : null;
        return slot.custom ?
          <CustomSlot
            {...slot}
            key={`${i.toString() + j.toString()} custom`}
            removeCustomSlot={() => this.props.removeCustomSlot(slot.id)}
            updateCustomSlot={this.props.updateCustomSlot}
            addCustomSlot={this.props.addCustomSlot}
            uses12HrTime={this.props.uses12HrTime}
          />
          :
          <Slot
            {...slot}
            fetchCourseInfo={() => this.props.fetchCourseInfo(courseId)}
            key={slot.id + i.toString() + j.toString()}
            locked={locked}
            classmates={this.props.socialSections ?
              this.props.getClassmatesInSection(courseId, slot.meeting_section) : []}
            lockOrUnlockSection={() => this.props.addOrRemoveCourse(courseId, slot.meeting_section)}
            removeCourse={() => {
              if (!isOptional) {
                return this.props.addOrRemoveCourse(courseId);
              }
              return this.props.addOrRemoveOptionalCourse(optionalCourse);
            }}
            primaryDisplayAttribute={this.props.primaryDisplayAttribute}
            updateCustomSlot={this.props.updateCustomSlot}
            addCustomSlot={this.props.addCustomSlot}
            uses12HrTime={this.props.uses12HrTime}
          />;
      });
      return (
        <td key={day}>
          <div className="fc-content-col">
            {daySlots}
          </div>
        </td>
      );
    });
    return (
      <table>
        <tbody>
          <tr>
            <td className="fc-axis" style={{ width: 49 }} />
            {allSlots}
          </tr>
        </tbody>
      </table>

    );
  }
}

SlotManager.defaultProps = {
  socialSections: false,
};

SlotManager.propTypes = {
  isLocked: PropTypes.func.isRequired,
  isCourseOptional: PropTypes.func.isRequired,
  getOptionalCourseById: PropTypes.func.isRequired,
  removeCustomSlot: PropTypes.func.isRequired,
  addOrRemoveCourse: PropTypes.func.isRequired,
  addOrRemoveOptionalCourse: PropTypes.func.isRequired,
  updateCustomSlot: PropTypes.func.isRequired,
  addCustomSlot: PropTypes.func.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  days: PropTypes.arrayOf(PropTypes.string).isRequired,
  slots: PropTypes.arrayOf(SemesterlyPropTypes.denormalizedSlot).isRequired,
  courseToColourIndex: PropTypes.shape({
    '*': PropTypes.number,
  }).isRequired,
  getClassmatesInSection: PropTypes.func.isRequired,
  custom: PropTypes.arrayOf(PropTypes.oneOfType([SemesterlyPropTypes.customSlot,
    PropTypes.shape({})])).isRequired,
  primaryDisplayAttribute: PropTypes.string.isRequired,
  socialSections: PropTypes.bool,
  uses12HrTime: PropTypes.bool.isRequired,
};

export default SlotManager;

