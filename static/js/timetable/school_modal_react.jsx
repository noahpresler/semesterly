 
var SchoolModal = React.createClass({
  mixins: [BootstrapModalMixin],
 
  getInitialState: function() {
    return {};
  },

  render: function() {
    var modal_style={top:'150'};
    /* to display "Pick Your School" above the school logos
    // var header = (          
    //       <div className="modal-header">
    //         <strong clasName="text-center">{this.props.header}</strong>
    //       </div>);
    */
    var header = null;
    return (
    <div className="modal fade" style={modal_style}>
      <div className="modal-dialog">
        <div className="modal-content">
          {header}
          <div className="modal-body">
            <img src="/static/img/school_logos/uoft_logo.png" className="school_logo" id="uoft_logo" 
            onClick={this.setSchool("uoft")}/>
            <img src="/static/img/school_logos/jhu_logo.png" className="school_logo" id="jhu_logo" 
            onClick={this.setSchool("jhu")}/>
          </div>
        </div>
      </div>
    </div>);
  },

  setSchool: function(new_school) {
    return (function(event) {
      this.props.setSchool(new_school);
      this.exitModal();
    }).bind(this);

  },

  exitModal: function() {
    this.props.handleCloseModal();
  },
  

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
 
