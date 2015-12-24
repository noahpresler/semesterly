
var MenuOption = React.createClass({

	render: function() {
		var button_style={backgroundColor: "#1fc08e"};
    if (this.props.chosen) { // if the relevant option has been picked (button pressed)
      button_style.color = "#ffffff"
      if (this.props.icon == "hotel") {
        button_style.backgroundColor = "#302C44"
      } else if (this.props.icon == "moon-o") {
        button_style.backgroundColor = "#1D3A37"
      } else if (this.props.icon == "glass") {
        button_style.backgroundColor= "#643934"
      } else {
        button_style.backgroundColor= "#453723"
      }
    } else {
      if (this.props.icon == "hotel") {
        button_style.backgroundColor = "#A094E3"
      } else if (this.props.icon == "moon-o") {
        button_style.backgroundColor = "#63C3BA"
      } else if (this.props.icon == "glass") {
        button_style.backgroundColor = "#FC9084"
      } else {
        button_style.backgroundColor = "#E8B875"
      }
    }
		return (
			<div className="menu-option-wrapper">
			<button 
				className="btn btn-xs menu-option" 
				style={button_style}
				onClick={this.handleChange}>
					<i className={"fa fa-2x fa-" + this.props.icon}></i>
          <input ref="checkbox" type="checkbox" className="menu-button-checkbox" ></input>
				</button>
				<p className="preferences-text"><small>{this.props.text}</small></p>
			</div>
		);
	},

  handleChange: function(event) {
    if (this.props.loading) {return;}
    this.refs.checkbox.checked = !this.refs.checkbox.checked;
    this.props.method(!this.refs.checkbox.checked);
  },
});



