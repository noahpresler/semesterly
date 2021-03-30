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
import uniq from 'lodash/uniq';
import COLOUR_DATA from '../constants/colours';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

class CommentSlot extends React.Component {
    constructor(props) {
        super(props);
        this.updateColours = this.updateColours.bind(this);
    }
    stopPropagation(callback, event) {
        event.stopPropagation();
        this.onMasterSlotUnhover();
        callback();
    }
    updateColours(colour) {
        // no updating when hovering over a masterslot in the course modal (i.e. related course)
        if (this.props.inModal) {
            return;
        }
        // update sibling slot colours (i.e. the slots for the same course)
        $(`.slot-${this.props.course.id}`)
            .css('background-color', colour);
    }
    render() {
        let masterSlotClass = `master-slot slot-${this.props.course.id}`;
        const validProfs = this.props.professors ? uniq(this.props.professors.filter(p => p)) : false;
        const prof = !validProfs || validProfs.length === 0 || validProfs[0] === '' ? 'Professor Unlisted' : validProfs.join(', ');
        //const profDisp = this.props.professors === null ? null : <h3>{ prof }</h3>;
        const profDisp = this.props.professors === <h3>Jeanie</h3>;
        return (<div
            className={masterSlotClass}
            style={{ backgroundColor: "$blue" }}
        >
            <div className="master-slot-content">
                { profDisp }
                <h3>
                    <span>{ this.props.course.code }</span>
                </h3>
                <h3>{ this.props.course.name }</h3>
            </div>
        </div>);
    }
}

CommentSlot.defaultProps = {
    inModal: false,
    fakeFriends: 0,
    hideCloseButton: false,
    course: PropTypes.shape({
        is_waitlist_only: false,
    }),
    author: null,
    slots: null,
};

CommentSlot.propTypes = {
    //colourIndex: PropTypes.number.isRequired,
    //author: PropTypes.string.isRequired,
    // inModal: PropTypes.bool,
    // course: PropTypes.shape({
    //     id: PropTypes.number.isRequired,
    //     num_credits: PropTypes.number.isRequired,
    //     code: PropTypes.string.isRequired,
    //     name: PropTypes.string.isRequired,
    //     is_waitlist_only: PropTypes.bool,
    //     slots: PropTypes.arrayOf(PropTypes.shape({
    //         is_section_filled: PropTypes.bool.isRequired,
    //     })),
    // }).isRequired,
    // professors: PropTypes.arrayOf(PropTypes.string),
    // hideCloseButton: PropTypes.bool,
    // fetchCourseInfo: PropTypes.func.isRequired,
};

export default CommentSlot;

