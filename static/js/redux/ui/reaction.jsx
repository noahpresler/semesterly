import React from 'react';
import ReactDOM from 'react-dom';
import { REACTION_MAP } from '../constants.jsx';

class Reaction extends React.Component {
	render() {
		let size = 20 + this.props.count/this.props.total * 45;
		let actionSize = 15 + 45*(this.props.count/this.props.total);
		let emojiStyle = {height: size, width: size};
		return (
			<div className="reaction">
				<div className="emoji" style={emojiStyle}
					dangerouslySetInnerHTML={{__html: twemoji.parse(REACTION_MAP[this.props.emoji].unicode)}}/>
				<div id="emoji-action">
					<i className="fa fa-plus"/>
				</div>
			</div>);
	}
}

export default Reaction;