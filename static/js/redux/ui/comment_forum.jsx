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

import React from 'react';
import PropTypes from 'prop-types';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';
import AdvisorMenu from './advisor_menu';
import CommentInputContainer from './containers/comment_input_container';

class CommentForum extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      studentName: 'Mia Boloix',
    };
  }

  render() {
    const { userInfo } = this.props;
    let transcript;
    if (this.props.transcript != null && this.props.transcript.comments != null) {
      transcript = this.props.transcript.comments.map((comment) => {
        const timestamp = new Date(comment.timestamp);
        const ownerView = (this.state.studentName === comment.author_name) ?
          (<span className="comment-row">
            <div className="comment-bubble owner">
              <div className="author">
                {comment.author_name}
              </div>
              <div>
                {comment.content}
              </div>
            </div>
            <div className="comment-timestamp">
              {timestamp.toDateString()},
              {timestamp.toLocaleTimeString()}
            </div>
          </span>) :
          (<span className="comment-row">
            <div className="comment-bubble guest">
              <div className="author">
                {comment.author_name}
              </div>
              <div className="comment-content">
                {comment.content}
              </div>
            </div>
            <div className="comment-timestamp" style={{ float: 'left' }}>
              {timestamp.toDateString()},
            {timestamp.toLocaleTimeString()}
            </div>
          </span>);
        return (<span key={timestamp}>
          {ownerView}
        </span>);
      });
    } else if (this.props.transcript === null) {
      transcript = <div className="empty-state"><h4> <p> No semester selected! </p> </h4></div>;
    } else if (this.props.transcript.comments === null) {
      transcript = <div className="empty-state"><h4> <p> No comments yet! </p> </h4></div>;
    }

    const displayInput = (this.props.selected_semester === null) ? null : (<CommentInputContainer
      semester_name={this.props.selected_semester.toString().split(' ')[0]}
      semester_year={this.props.selected_semester.toString().split(' ')[1]}
    />);

    const displayAdvisorNames = () => {
      const names = [];
      const advisorList = (this.props.transcript) ? this.props.transcript.advisors : [];
      advisorList.forEach(advisor => names.push(advisor.full_name));
      return names.join(', ');
    };

    return (
      <div className="comment-forum no-print">
        <div className="cf-name">
          <h3 className="title"> Comments Forum</h3>
        </div>
        {this.props.selected_semester &&
          <AdvisorMenu
            semester={this.props.selected_semester}
            advisors={userInfo.advisors}
            transcript={this.props.transcript}
            addAdvisor={this.state.addAdvisor}
            addRemoveAdvisor={this.props.addRemoveAdvisor}
          />
        }
        <div className="cf-header">{this.props.selected_semester && displayAdvisorNames()}</div>
        <div className="comment-forum-container">
          {transcript}
        </div>
        <div className="as-header" />
        { displayInput}
      </div>
    );
  }
}

CommentForum.defaultProps = {
  selected_semester: null,
  transcript: null,
};

CommentForum.propTypes = {
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
  addRemoveAdvisor: PropTypes.func.isRequired,
  selected_semester: PropTypes.string,
  transcript: SemesterlyPropTypes.transcript,
};

export default CommentForum;
