module.exports = React.createClass({
	getInitialState: function() {
		return {shown: false};
	},
	render: function() {
		return (
			<div></div>
		);
	},

	toggle: function() {
		if (this.state.shown) {
			this.hide();
		}
		else {
			this.show();
		}
	},

	show: function() {
		var close_button = this.props.allow_disable ? 
		(<i onClick={this.hide} className="right fa fa-times close-course-modal" />) : null
		ReactDOM.render(
  			(
			<div className={"simple-modal-wrapper " + this.props.key}>
				<div id="dim-screen" onClick={this.maybeHide}></div>
				<div className="simple-modal" style={this.props.styles}>
					<h6 className="simple-modal-header">{this.props.header} {close_button}</h6>
					<hr className="simple-modal-separator"/>
					<div className="simple-modal-content">
						{this.props.content}
					</div>
				</div>
			</div>),
  			document.getElementById('semesterly-modal')
		);
		$("#dim-screen").height($(document).height());
		this.setState({shown: true});
	},

	maybeHide: function() {
		if (this.props.allow_disable) {
			this.hide();
		}	
	},

	hide: function() {
		if ($("." + this.props.key).length == 0) {return;}
		var container = document.getElementById('semesterly-modal');
		$("#dim-screen").fadeOut(800, function() {
	        ReactDOM.unmountComponentAtNode(container);
		});
		var sel = ".simple-modal";

		if ($(sel).offset().left < 0) {
            $(sel).css("left", "150%");
        } else if ($(sel).offset().left > $('body').width()) {
            $(sel).animate({
                left: '50%',
            }, 800 );
        } else {
            $(sel).animate({
                left: '-150%',
            }, 800 );
        }
		this.setState({shown: false});

	},
});
