module.exports = React.createClass({

	getInitialState: function() {
		return {show_link_popover: false};
	},

  	getShareLink: function() {
    	var link = window.location.host + "/";
    	var data = this.props.getData();
    	return link + data;
  	},

  	toggleLinkPopover: function(event) {
		this.setState({show_link_popover: !this.state.show_link_popover});
  	},

	render: function() {
		var pop = this.state.show_link_popover ? 
		(<div>
            <div className="copy-arrow-up"></div>
			<div className="copy-content">
				The link for this timetable is below. Copy it to easily share your schedule with friends.
				<textarea onClick={this.highlightAll} ref="link" className="copy-text" value={this.getShareLink()} readOnly></textarea>
			</div>
		</div>) :
		null;
		return (
			<div className="right copy-button">
			<a className="btn btn-primary calendar-function" onClick={this.toggleLinkPopover}>
              <span className="fui-clip"></span>
            </a>
            {pop}

            </div>
		);
	},
	highlightAll: function(e) {
		this.refs.link.select();
	},
	componentDidUpdate: function() {
		if (!this.state.show_link_popover) {return;}
		this.highlightAll();
	},

	componentDidMount: function() {
		$(document).on("click", function(e) {
			e.stopPropagation();
			var target = $(e.target);
			if ((target).is('.copy-button *, .copy-button')) {
				return;
			}
			if (this.state.show_link_popover) {
				this.setState({show_link_popover: false});
			}

		}.bind(this));
	},

});