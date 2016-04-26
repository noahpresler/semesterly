import React from 'react';

class ConflictAlert extends React.Component {
	constructor(props) {
		super(props);
	}
	componentWillUnmount() {
		this.props.dismissSelf();
	}
	handleClick() {
		this.props.turnConflictsOn();
		this.props.dismissSelf();
	}
	render() {
		return (
		<div className="conflict-alert">
			Adding that course causes a conflict!
			<button 
				onClick={() => this.handleClick()}
				className="conflict-alert-btn">
				Turn Conflicts On!
			</button>
	 	</div>);
 	}
};

export default ConflictAlert;
