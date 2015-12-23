"use strict";

var SchoolModal = React.createClass({
  displayName: "SchoolModal",

  mixins: [BootstrapModalMixin],

  getInitialState: function getInitialState() {
    return {};
  },

  render: function render() {
    var modal_style = { top: '150' };
    /* to display "Pick Your School" above the school logos
    // var header = (          
    //       <div className="modal-header">
    //         <strong clasName="text-center">{this.props.header}</strong>
    //       </div>);
    */
    var header = null;
    return React.createElement(
      "div",
      { className: "modal fade", style: modal_style },
      React.createElement(
        "div",
        { className: "modal-dialog" },
        React.createElement(
          "div",
          { className: "modal-content" },
          header,
          React.createElement(
            "div",
            { className: "modal-body" },
            React.createElement("img", { src: "/static/img/school_logos/uoft_logo.png", className: "school_logo", id: "uoft_logo",
              onClick: this.setSchool("uoft") }),
            React.createElement("img", { src: "/static/img/school_logos/jhu_logo.png", className: "school_logo", id: "jhu_logo",
              onClick: this.setSchool("jhu") })
          )
        )
      )
    );
  },

  setSchool: function setSchool(new_school) {
    return (function (event) {
      this.props.setSchool(new_school);
      this.exitModal();
    }).bind(this);
  },

  exitModal: function exitModal() {
    this.props.handleCloseModal();
  }

});

/* 
TEMPORARILY REMOVED PREFERENCES: Grouped together, spread apart
// <div className="checkbox">
//   <label>
//     <input type="checkbox" id='groupedCheckbox' value='??' ref='grouped' onChange={this.handleGroupedChange}> I want my classes grouped together. </input>
//   </label>
// </div>
// <div className="checkbox">
//   <label>
//     <input type="checkbox" id='spreadCheckbox' value='??' ref='spread' onChange={this.handleSpreadChange}> I want my classes spread out. </input>
//   </label>
// </div>



*/