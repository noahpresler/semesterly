import React from 'react';
import ReactDOM from 'react-dom';
import { REACTION_MAP } from '../constants.jsx';
import classNames from 'classnames';

class Reaction extends React.Component {
	constructor(props) {
		super(props);
		this.state = {didSelect: this.props.selected === true, animating: true};
		this.toggleSelected = this.toggleSelected.bind(this);
		this.animate = this.animate.bind(this);
	}
	toggleSelected() {
		this.setState({animating: true});
		this.animate()
		this.props.react();
		this.setState({
			didSelect: !this.state.didSelect
		});
	}
	componentDidMount() {
		this.animate()
	}
	animate() {
		setTimeout(() => {
			this.setState({animating: false});
		}, 300);
	}
	render() {
		let size = 20 + this.props.count/this.props.total * 45;
		let actionSize = 15 + 45*(this.props.count/this.props.total);
		let emojiStyle = {height: size, width: size};
		return (
			<div className={classNames({"swing": true, "reaction": true, "no-animate": !this.state.animating})} onClick={this.toggleSelected}>
				<div className="emoji" style={emojiStyle}
					dangerouslySetInnerHTML={{__html: twemoji.parse(REACTION_MAP[this.props.emoji].unicode)}}/>
				<div className={classNames({'action-container' : true, 'selected': this.state.didSelect})}>
					<div className="emoji-action">
						<i className="fa fa-plus"/>
					</div>
					<div className="emoji-count">
						<span>{this.props.count}</span>
					</div>
					<div className="emoji-check">
						<i className="fa fa-check"/>
					</div>
				</div>
				<div id="reaction-dropdown">
					<div className="tip-border"></div>
					<div className="tip"></div>
					<span>{REACTION_MAP[this.props.emoji].name}</span>
				</div>
			</div>);
	}
}

export default Reaction;