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

import React from "react";
import PropTypes from 'prop-types';

class Comment extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		var timestamp = new Date(this.props.timestamp);
		return (
			<span className="comment-row">
				<div className="comment-bubble">
					<div className="author">{this.props.author}</div>
					<div>{this.props.content}</div>
				</div>
				<div className="comment-timestamp">{timestamp.toDateString()}, {timestamp.toLocaleTimeString()}</div>
			</span>
		);
	}

}

export default Comment;
