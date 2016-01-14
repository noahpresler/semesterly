module.exports = React.createClass({
  getInitialState: function() {
    var num_bubbles = this.getNumBubbles();
    return {first_displayed: 0, num_bubbles: num_bubbles};
  },
  getNumBubbles: function() {
    var bubbles = $(window).width() > 700 ? 9 : 4;
    return bubbles;
  },

  changePage: function(direction) {
      return (function(event) {
       var current = this.props.current_index,
           count = this.props.count;
       // calculate the new first_displayed button (timetable)
       var new_first = current + (this.state.num_bubbles*direction) - (current % this.state.num_bubbles);
       if (new_first >= 0 && new_first < count) {
        this.props.setIndex(new_first)();
       }
    }.bind(this));
  },

  render: function() {
    var options = [], count = this.props.count, current = this.props.current_index;
    if (count <= 1) { return null; } // don't display if there aren't enough schedules
    var first = current - (current % this.state.num_bubbles); // round down to nearest multiple of this.props.numBubbles
    var limit = Math.min(first + this.state.num_bubbles, count);
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

  componentDidMount: function() {
    $(window).resize(function() {
      this.setState({num_bubbles: this.getNumBubbles()});
    }.bind(this));
  },
  

});