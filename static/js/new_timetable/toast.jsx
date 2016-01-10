module.exports = React.createClass({
	getInitialState: function() {
		return {visible: true};
	},		
	render: function() {
		var toast = this.state.visible ? 
				(<div className="sem-toast-wrapper toasting">
					<div className="sem-toast">{this.props.content}</div>
				</div>) : null;
		return toast;
	},
	componentDidMount: function() {
		setTimeout(function() {
			if (this._reactInternalInstance) { // if mounted still
				this.setState({visible: false});
			}
		}.bind(this), 4000);
	},

});
