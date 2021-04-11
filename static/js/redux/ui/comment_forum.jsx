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
import CommentInputContainer from './containers/comment_input_container';
import Comment from './comment';


class CommentForum extends React.Component {

  render() {
    let transcript;
    if (this.props.transcript != null && this.props.transcript.comments != null) {
      transcript = this.props.transcript.comments.map(comment => (
        <Comment
          key={comment.timestamp}
          author={comment.author_name}
          content={comment.content}
          timestamp={comment.timestamp}
        />
    ));
    } else if (this.props.transcript === null) {
      transcript = <div className="empty-state"><h4> <p> No semester selected! </p> </h4></div>;
    } else if (this.props.transcript.comments === null) {
      transcript = <div className="empty-state"><h4> <p> No comments yet! </p> </h4></div>;
    }

    const displayInput = (this.props.selected_semester === null) ? null : (<CommentInputContainer
      semester_name={this.props.selected_semester.toString().split(' ')[0]}
      semester_year={this.props.selected_semester.toString().split(' ')[1]}
    />);

    return (
      <div className="comment-forum no-print">
        <div className="cf-name">
          <p style={{ fontSize: '1.25em', fontWeight: 'bold', marginTop: '70px' }}>
              Comments Forum
          </p>
        </div>
        <div className="as-header" />
        <div className="comment-forum-container">
          { transcript }
        </div>
        <div className="as-header" />
        { displayInput }
      </div>
    );
  }
}

CommentForum.defaultProps = {
  selected_semester: null,
  transcript: null,
};

CommentForum.propTypes = {
  // displayed_semester: PropTypes.string.isRequired,
  selected_semester: PropTypes.string,
  transcript: PropTypes.shape({
    semester_name: PropTypes.string,
    semester_year: PropTypes.string,
    owner: PropTypes.string,
    comments: PropTypes.arrayOf(PropTypes.shape({
      author_name: PropTypes.string,
      content: PropTypes.string,
      timestamp: PropTypes.date,
    })),
  }),
};

export default CommentForum;
