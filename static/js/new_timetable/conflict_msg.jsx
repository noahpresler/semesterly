module.exports = React.createClass({

  render: function() {
    return (
      <div className="alert alert-danger alert-dismissable conflict-msg" style={{display: this.props.visible ? "inherit" : "none"}}>
        <span className="fa-stack fa-lg">
          <i className="fa fa-ban fa-stack-2x calendar-ban"></i>
        </span>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <strong>That course/section could not be added without a conflict!</strong> 
        Give it a shot with conflicts turned on!
        <div>
        <button type="button" className="btn btn-danger btn-conflict" >
          Turn conflicts on
        </button>
        <button type="button" className="btn btn-danger btn-conflict" >
          Exit
        </button>
        </div>
      </div>
    )
  }
});