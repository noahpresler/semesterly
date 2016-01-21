module.exports = React.createClass({
  getInitialState: function() {
    var num_bubbles = this.getNumBubbles();
    return {num_bubbles: num_bubbles};
  },
  getNumBubbles: function() {
    var bubbles = $(window).width() > 700 ? 9 : 4;
    return bubbles;
  },

  changePage: function(direction) {
      return (function(event) {
       var current = this.props.current_index,
           count = this.props.count;
       // calculate the new first displayed button (timetable)
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
      var className = this.props.current_index == i ? "sem-page active" : "sem-page";
      options.push(
        <li key={i} className={className} onClick={this.props.setIndex(i)}>
              <a>{i + 1}</a>
        </li>);
    }
    var prev_double = (
      <div className="sem-pagination-nav nav-double nav-double-prev" onClick={this.changePage(-1)}>
        <i className="fa fa-angle-double-left sem-pagination-prev sem-pagination-icon" />
      </div>
    );
    var next_double = (
      <div className="sem-pagination-nav nav-double nav-double-next" onClick={this.changePage(1)}>
        <i className="fa fa-angle-double-right sem-pagination-next sem-pagination-icon" />
      </div>
    );
    if (count < (this.state.num_bubbles + 1)) {
      prev_double = null;
      next_double = null;
    }
		return (
			<div className="sem-pagination">
				{prev_double}
				<div className="sem-pagination-nav" onClick={this.props.prev}>
					<i className="fa fa-angle-left sem-pagination-prev sem-pagination-icon" />
				</div>
				<ol className="sem-pages">
					{options}
				</ol>
				<div className="sem-pagination-nav" onClick={this.props.next}>
					<i className="fa fa-angle-right sem-pagination-next sem-pagination-icon" />
				</div>
				{next_double}
			</div>
		);
	},
  componentDidMount: function() {
    $(window).resize(function() {
      this.setState({num_bubbles: this.getNumBubbles()});
    }.bind(this));
  },


});