module.exports = React.createClass({
  getInitialState: function() {
    return {first_displayed: 0};
  },

  changePage: function(direction) {
      return (function(event) {
       var current = this.props.current_index,
           count = this.props.count;
       // calculate the new first_displayed button (timetable)
       var new_first = current + (9*direction) - (current % 9);
       if (new_first >= 0 && new_first < count) {
        this.props.setIndex(new_first)();
       }
    }.bind(this));
  },

  render: function() {
    var options = [], count = this.props.count, current = this.props.current_index;
    if (count <= 1) { return null; } // don't display if there aren't enough schedules
    var first = current - (current % 9); // round down to nearest multiple of this.props.numBubbles
    var limit = Math.min(first + 9, count);
    for (var i = first; i < limit; i++) {
      var className = this.props.current_index == i ? "active" : "";
      options.push(
        <li key={i} className={className}>
              <a onClick={this.props.setIndex(i)}>{i + 1}</a>
        </li>);
    }

    return (
        <div className="pagination pagination-minimal">
          <ul>
            <li className="prev-double" onClick={this.changePage(-1)}>
              <div className="pagination-btn">
                <span className="fa fa-angle-double-left"></span></div>
            </li>
            <li className="previous">
              <a className="fui-arrow-left pagination-btn" 
                onClick={this.props.prev}></a>
            </li>
            {options}
            
            <li className="next">
              <a className="fui-arrow-right pagination-btn"
                onClick={this.props.next}></a>
            </li>
            <li className="next-double" onClick={this.changePage(1)}>
              <div className="pagination-btn">
                <span className="fa fa-angle-double-right"></span></div>
            </li>
          </ul>
        </div>
    );
  },
  

});