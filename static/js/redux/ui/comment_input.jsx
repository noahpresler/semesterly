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
import Cookie from 'js-cookie';
import { getTranscriptCommentsBySemester } from '../constants/endpoints';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

class CommentInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      comment: '',
    };
  }

  sendContent(event) {
    this.setState({ comment: event.target.value });
  }

  submitContent(semesterName, semesterYear) {
    fetch(getTranscriptCommentsBySemester(semesterName, semesterYear), {
      method: 'POST',
      headers: {
        'X-CSRFToken': Cookie.get('csrftoken'),
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jhed: this.props.userInfo.jhed,
        timestamp: new Date(Date.now()),
        content: this.state.comment,
      }),
    });
  }

  render() {
    const { comment } = this.state;
    const { semester_name, semester_year } = this.props;

    return (<div className="cf-text-input">
      <form action="#0">
        <textarea
          className="cf-input"
          rows="1" placeholder="Type your comment here..."
          value={comment}
          onChange={event => this.sendContent(event)}
          onKeyPress="if (event.keyCode==13){submitContent(semester_name, \
          semester_year);return false;}"
        />
        <input
          className="send-btn"
          type="submit"
          value="+"
          onClick={() => this.submitContent(semester_name, semester_year)}
        />
      </form>
    </div>
    );
  }
}

CommentInput.propTypes = {
  semester_name: PropTypes.string.isRequired,
  semester_year: PropTypes.string.isRequired,
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
};

export default CommentInput;
