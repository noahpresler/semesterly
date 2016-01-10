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
    	var first = current - (current % 9); // round down to nearest multiple of 9
    	var limit = Math.min(first + 9, count);
    	for (var i = first; i < limit; i++) {
     	 var className = this.props.current_index == i ? "active" : "";
      		options.push(
        		<li key={i} className={"sem-page " + className} onClick={this.props.setIndex(i)}>
             		 {i + 1}
       			</li>);
  		}
		return (
			<div className="sem-pagination">
				<div className="sem-pagination-nav nav-double nav-double-prev" onClick={this.changePage(-1)}>
					<i className="fa fa-angle-double-left sem-pagination-prev sem-pagination-icon" />
				</div>
				<div className="sem-pagination-nav" onClick={this.props.prev}>
					<i className="fa fa-angle-left sem-pagination-prev sem-pagination-icon" />
				</div>
				<ol className="sem-pages">
					{options}
				</ol>
				<div className="sem-pagination-nav" onClick={this.props.next}>
					<i className="fa fa-angle-right sem-pagination-next sem-pagination-icon" />
				</div>
				<div className="sem-pagination-nav nav-double nav-double-next" onClick={this.changePage(1)}>
					<i className="fa fa-angle-double-right sem-pagination-next sem-pagination-icon" />
				</div>
			</div>
		);
	},
});