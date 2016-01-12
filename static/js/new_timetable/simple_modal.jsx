module.exports = React.createClass({
	
	render: function() {
		return (
			<div>
			 	<div id="dim-screen"></div>
				<div className="simple-modal" style={this.props.styles}>
					<h6 className="simple-modal-header">{this.props.header}</h6>
					<hr className="simple-modal-separator"/>
					<div className="simple-modal-content">
						{this.props.content}
					</div>
				</div>
			</div>

		);
	},

});
