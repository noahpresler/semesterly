var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');
var SimpleModal = require('./simple_modal');

module.exports = React.createClass({
  mixins: [Reflux.connect(TimetableStore)],

  getAddons: function() {
  	var addons = [
  		{
  			link: "http://amzn.to/1OzFaOQ",
  			img: "http://ecx.images-amazon.com/images/I/71508stXp7L._SX522_.jpg",
  			title: "Mead Spiral Notebook",
  			price: "$8.98",
  			prime_eligible: true
  		},
  		{
  			link: "http://amzn.to/1ZuQRLT",
  			img: "http://ecx.images-amazon.com/images/I/61V6woEdngL._SY679_.jpg",
  			title: "BIC Highlighters",
  			price: "$4.04",
  			prime_eligible: true
  		},
  		{
  			link: "http://amzn.to/1ZuR3dY",
  			img: "http://ecx.images-amazon.com/images/I/81qjewvKndL._SX522_.jpg",
  			title: "25 Pocket Folders",
  			price: "$6.98",
  			prime_eligible: true
  		}
  	]
  	var addonsHTML = addons.map(function(item, i) {
  		var img = <img height="125" src={item.img}/>
  		var title = <h6 className="line-clamp title">{item.title}</h6>
  		var price = <h6 className="price">{item.price}</h6>
  		var prime_logo = item.prime_eligible ? <img className="prime" height="15px" src="/static/img/prime.png"/> : null
  		return (
  			<div className="addon custom-addon" key={i}>
  				<a href={item.link} target="_blank"> 
	  				{img}
	  				{title}
	  				<div className="price-prime-container">
		  				{price}
		  				{prime_logo}
		  			</div>
	  			</a>
  			</div>)
  	}.bind(this));
  	return (<div className="addon-wrapper">{addonsHTML}</div>)
  },

  render: function() {
  	var html = this.props.courses.map(function(c, i) {
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
	            <a className="textbook" href={tb['detail_url']} target="_blank" key={tb['id']}>
	                <img height="125" src={img}/>
	                <div className="module">
	                  <h6 className="line-clamp">{title}</h6>
                  </div>
                  <img src="https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif" width="120" height="28" border="0"/>
	            </a>);
  			}.bind(this));
        var header = this.props.school == "uoft" ? (
              <h6>{c.code}: {c.name}</h6> ) : 
             (<h6>{c.name}</h6>);
	  		return (
	  			<div className="textbook-list-entry" key={i}>
	  				{header}
	  				 <div className="course-roster textbook-list">
	  					{inner_html}
	  				</div>
	  			</div>)
  		}
  		else {
  			return null
  		}
  	}.bind(this));
    return (
    	<div className="textbook-list-wrapper">
        {this.props.addToCart}
    		{html}
    		<div className="textbook-list-entry">
  				<h6>Popular Addons</h6>
    			{this.getAddons()}
    		</div>
    	</div>)
  },

});