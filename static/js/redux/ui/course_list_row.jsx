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

import { getNextAvailableColour } from "../util";
import MasterSlot from "./master_slot";
import CreditTickerContainer from "./containers/credit_ticker_container";
import Collapsible from "react-collapsible";
import React from 'react';

class CourseListRow extends React.Component{

	sendSelectedSemester() {
		if (this.props.displayed_semester !== this.props.selected_semester) {
			this.props.parentParentCallback(this.props.displayed_semester);
		} else {
			this.props.parentParentCallback(null);
		}
	}

	render () {
		//TODO: We want to grab the courses on the student's timetable
		// Check what is in this variable: console.log(this.props.coursesInTimetable);
		let plannedCourseList = this.props.mandatoryCourses ?
			this.props.mandatoryCourses.map((course) => {
				const colourIndex = (course.id in this.props.courseToColourIndex) ?
					this.props.courseToColourIndex[course.id] :
					getNextAvailableColour(this.props.courseToColourIndex);
				const professors = course.sections.map(section => section.instructors);
				return (<MasterSlot
					key={course.id}
					professors={professors}
					colourIndex={colourIndex}
					classmates={this.props.courseToClassmates[course.id]}
					onTimetable={this.props.isCourseInRoster(course.id)}
					course={course}
					fetchCourseInfo={() => this.props.fetchCourseInfo(course.id)}
					removeCourse={() => this.props.removeCourse(course.id)}
					getShareLink={this.props.getShareLink}
				/>);
			}) : null;

		if (plannedCourseList === null) {
			plannedCourseList = (
				<div className="empty-state">
					<img src="/static/img/emptystates/masterslots.png" alt="No courses added."/>
					<h4>Looks like you don&#39;t have any courses yet!</h4>
					<h3>Your selections will appear here along with credits, professors and friends
						in the class</h3>
				</div>);
		}

		const courseList = (<div className="course-list-container">
			<CreditTickerContainer/>
			<a>
				<h4 className="as-header">
					Planned Courses
				</h4>
			</a>
			<div className="as-master-slots">
				{plannedCourseList}
			</div>
		</div>);

		const scheduleName = prop => (<div className="as-semester-name-container">
			<div className="as-semester-name">
				{this.props.displayed_semester}
			</div>
			<div className="as-tip-container">
				{prop ? <span className="as-tip up"></span> : <span className="as-tip"></span>}
			</div>
		</div>);

		return (
				<Collapsible open={(this.props.displayed_semester === this.props.selected_semester)}
				             trigger={scheduleName(true)}
				             triggerWhenOpen={scheduleName(false)}
				             handleTriggerClick={() => {this.sendSelectedSemester();}}>
					<div>
						{ courseList }
					</div>
				</Collapsible>
		);
	}
}

export default CourseListRow;
