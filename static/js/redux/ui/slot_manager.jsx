import React from 'react';
import { renderCourseModal } from './course_modal';
import Slot from './slot';
import CustomSlot from './custom_slot';
import { index as IntervalTree, matches01 as getIntersections } from 'static-interval-tree';
import COLOUR_DATA from '../constants/colours';

class SlotManager extends React.Component {

  render() {
    const slots_by_day = this.getSlotsByDay();
    const all_slots = this.props.days.map((day, i) => {
      const day_slots = slots_by_day[day].map((slot, j) => {
        const courseId = slot.course;
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
          />
                    :
          <Slot
            {...slot}
            fetchCourseInfo={() => this.props.fetchCourseInfo(courseId)}
            key={slot.fake ? -slot.id : slot.id + i.toString() + j.toString()}
            locked={locked}
            classmates={this.props.socialSections ? this.props.classmates(courseId, slot.meeting_section) : []}
            lockOrUnlockSection={() => this.props.addOrRemoveCourse(courseId, slot.meeting_section)}
            removeCourse={() => !isOptional ? (this.props.addOrRemoveCourse(courseId)) : (this.props.addOrRemoveOptionalCourse(optionalCourse))}
            primaryDisplayAttribute={this.props.primaryDisplayAttribute}
            updateCustomSlot={this.props.updateCustomSlot}
            addCustomSlot={this.props.addCustomSlot}
          />;
      });
      return (
        <td key={day}>
          <div className="fc-content-col">
            {day_slots}
          </div>
        </td>
      );
    });
    return (
      <table>
        <tbody>
          <tr>
            <td className="fc-axis" style={{ width: 49 }} />
            {all_slots}
          </tr>
        </tbody>
      </table>

    );
  }

  getSlotsByDay() {
    const slots_by_day = {
      M: [], T: [], W: [], R: [], F: [],
    };
    const courses = this.props.timetable.courses;

        // course slots
    for (const i in courses) {
      const crs = courses[i];
      for (const slotId in crs.slots) {
        const slotObj = crs.slots[slotId];
                // first assume this course already has a colour (was added previously)
        const colourIndex = _.range(COLOUR_DATA.length).find(i =>
                    !Object.values(this.props.courseToColourIndex).some(x => x === i),
                );
        const colourId = this.props.courseToColourIndex[slotObj.course] === undefined ? colourIndex : this.props.courseToColourIndex[slotObj.course];
        const slot = Object.assign(slotObj, {
          colourId, code: crs.code, name: crs.name,
        });
        if (slots_by_day[slot.day]) {
          slot.custom = false;
          slots_by_day[slot.day].push(slot);
        }
      }
    }

        // custom slots
    for (const i in this.props.custom) {
      const custom_slot = this.props.custom[i];
      custom_slot.custom = true;
      custom_slot.key = custom_slot.id;
      slots_by_day[custom_slot.day].push(custom_slot);
    }
    return this.getConflictStyles(slots_by_day);
  }

  getConflictStyles(slots_by_day) {
    for (const day in slots_by_day) {
      const day_slots = slots_by_day[day];
            // sort by start time
      day_slots.sort((a, b) => this.getMinutes(a.time_start) - this.getMinutes(b.time_start));

            // build interval tree corresponding to entire slot
      const intervals = day_slots.map((slot, index) => ({
        start: this.getMinutes(slot.time_start),
        end: this.getMinutes(slot.time_end),
        id: index, // use day_slot index to map back to the slot object
      }));
      const tree = IntervalTree(intervals);

            // build interval tree with part of slot that should not be overlayed (first hour)
      const info_intervals = intervals.map(s => ({
        start: s.start,
        end: Math.min(s.start + 60, s.end),
        id: s.id,
      }));
      const info_slots = IntervalTree(info_intervals);

            // bit map to store if slot has already been processed
      const seen = day_slots.map(() => false);

            // bit map to store if slot has already been added to queue
      const added = day_slots.map(() => false);

            // get num_conflicts + shift_index
      for (let i = 0; i < info_intervals.length; i++) {
        if (!seen[i]) { // if not seen, perform dfs search on conflicts
          const direct_conflicts = [];
          const frontier = [info_intervals[i]];
          while (frontier.length > 0) {
            const next = frontier.pop();
            seen[next.id] = true;
            added[next.id] = true;
            direct_conflicts.push(next);
            const neighbors = getIntersections(info_slots, next);
            for (let k = 0; k < neighbors.length; k++) {
              if (!seen[neighbors[k].id] && !added[neighbors[k].id]) {
                frontier.push(neighbors[k]);
                added[neighbors[k].id] = true;
              }
            }
          }
          direct_conflicts.sort((a, b) => (intervals[b.id].end - intervals[b.id].start) - (intervals[a.id].end - intervals[a.id].start));
          for (let j = 0; j < direct_conflicts.length; j++) {
            const slotId = direct_conflicts[j].id;
            day_slots[slotId].num_conflicts = direct_conflicts.length;
            day_slots[slotId].shift_index = j;
          }
        }
      }

            // build interval tree with part of slot that should not be overlayed
      const over_slots = IntervalTree(intervals.filter(s => s.end - s.start > 60).map(s => ({
        start: s.start + 60,
        end: s.end,
        id: s.id,
      })));

            // get depth_level
      for (let i = 0; i < info_intervals.length; i++) {
        const conflicts = getIntersections(over_slots, info_intervals[i]);
        conflicts.sort((a, b) => (b.start - a.start));
        day_slots[i].depth_level = conflicts.length > 0 ? day_slots[conflicts[0].id].depth_level + 1 : 0;
      }
      slots_by_day[day] = day_slots;
    }
    return slots_by_day;
  }

  getMinutes(time_string) {
    const l = time_string.split(':');
    return (+l[0]) * 60 + (+l[1]);
  }
}

export default SlotManager;
