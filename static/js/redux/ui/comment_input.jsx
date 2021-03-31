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

class CommentInput extends React.Component {

	constructor(props) {
		super(props);
	}

	componentWillMount() {
		$(document.body).on('keydown', (e) => {
			if (e.key === 'Enter') {
				//TODO: this.sendComment();
			}
		});
	}

	componentWillReceiveProps(nextProps) {
		this.setState({ name: nextProps.activeLoadedTimetableName });
	}

	showSignupModal() {
		if (!this.props.isLoggedIn) {
			this.props.openSignUpModal();
		}
	}

	//TODO:
	sendContent(event) {
		this.setState({ name: event.target.value });
	}

	render() {
		return (<div className="cf-text-input">
				<form action="#0">
					<textarea className="cf-input" rows="1" placeholder="Type your comment here..."/>
					<input className="send-btn" type="submit" value="+" />
				</form>
			</div>
		);
	}
}

CommentInput.propTypes = {
	isLoggedIn: PropTypes.bool.isRequired,
};

export default CommentInput;
