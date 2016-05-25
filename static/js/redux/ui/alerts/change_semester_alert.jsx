import React from 'react';

class ChangeSemesterAlert extends React.Component {
	constructor(props) {
		super(props);
	}
	componentWillUnmount() {
		this.props.dismissSelf();
	}
	handleClick() {
		this.props.handleChangeSemester();	
		this.props.dismissSelf();
	}
	render() {
		return (
		<div className="conflict-alert change-semester-alert">
			{ this.props.msg }

			<button 
				onClick={() => this.handleClick()}
				className="conflict-alert-btn change-semester-btn">
				Change Semester Anyway
			</button>
			{ 
				!this.props.isLoggedIn ? 
				<small className="alert-extra">
					Psst – Signing up allows you to save multiple timetables for all semesters!
				</small>
				: null
			}
	 	</div>);
 	}
};

export default ChangeSemesterAlert;
