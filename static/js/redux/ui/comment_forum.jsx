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
import CommentInputContainer from './containers/comment_input_container';
import Transcript from './transcript';
import {getTranscriptCommentsBySemester} from '../constants/endpoints';


class CommentForum extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let transcript;
        if (this.props.transcript != null && this.props.transcript.comments != null) {
            transcript = <Transcript
                comments={this.props.transcript.comments}
            />;
        } else if (this.props.transcript === null) {
          transcript = <div className="empty-state"><h4> <p> No semester selected! </p> </h4></div>;
        } else if (this.props.transcript.comments === null){
          transcript = <div className="empty-state"><h4> <p> No comments yet! </p> </h4></div>;
        }

        const displayInput = (this.props.selected_semester === null) ? null : (<CommentInputContainer
          semester_name={this.props.selected_semester.toString().split(' ')[0]}
          semester_year={this.props.selected_semester.toString().split(' ')[1]}
        />);

        return (
            <div className="comment-forum no-print">
                <div className="cf-name">
                    <p style={{fontSize: "1.25em", fontWeight: "bold", marginTop: "70px" }}>
                        Comments Forum
                    </p>
                </div>
                <div className="as-header"></div>
                <div className="comment-forum-container">
                  { transcript }
                </div>
                <div className="as-header"></div>
              { displayInput }
            </div>
        );
    }
}

export default CommentForum;
