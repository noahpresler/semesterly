var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');
var SimpleModal = require('./simple_modal');

module.exports = React.createClass({
  mixins: [Reflux.connect(TimetableStore)],

  render: function() {
  	var html = this.props.courses.map(function(c) {
  		if ( c.textbooks.length > 0 ) {
  		  var inner_html = c.textbooks.map(function(tb) {
	  		  if (tb['image_url'] === "Cannot be found") {
	            var img = '/static/img/default_cover.jpg'
	          } else {
	            var img = tb['image_url']
	          }
	          if (tb['title'] == "Cannot be found") {
	            var title = "#" +  tb['isbn']
	          } else {
	            var title = tb['title']
	          }
	          return ( 
	            <div className="textbook" key={tb['id']}>
	                <img height="125" src={img}/>
	                <div className="module">
	                  <h6 className="line-clamp">{title}</h6>
	                  </div>
	                <a href={tb['detail_url']} target="_blank">
	                  <img src="https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif" width="120" height="28" border="0"/>
	                </a>
	            </div>);
  			}.bind(this));
	  		return (
	  			<div className="textbook-list-entry">
	  				<h6>{c.name}</h6>
	  				 <div className="course-roster textbook-list">
	  					{inner_html}
	  				</div>
	  			</div>)
  		}
  		else {
  			return null
  		}
  	}.bind(this));
    return (<div className="textbook-list-wrapper">{html}</div>)
  },

});