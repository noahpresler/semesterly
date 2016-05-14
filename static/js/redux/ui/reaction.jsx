import React from 'react';
import ReactDOM from 'react-dom';
import { REACTION_MAP } from '../constants.jsx';

class Reaction extends React.Component {
	render() {
		console.log(REACTION_MAP[this.props.emoji].unicode);
		return (
			<div className="reaction">
				<div className="emoji"
					dangerouslySetInnerHTML={{__html: twemoji.parse(REACTION_MAP[this.props.emoji].unicode)}}/>
				<span>{this.props.count}</span>
			</div>);
	}
}

export default Reaction;