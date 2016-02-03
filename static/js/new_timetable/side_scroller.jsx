var Carousel = require('nuka-carousel');

module.exports = React.createClass({
  mixins: [Carousel.ControllerMixin],

  getInitialState: function() {
    return {num_items: 1};
  },
  updateNumItems: function() {
    if (!this.props.slidesToShow) {
      return;
    }
    var width = $(".slider").width();
    var section_width = $(".section-wrapper").width() + 15;
    items = Math.max(2, parseInt(width/section_width));
    this.setState({num_items: items});

    // move slider list left (so that first item is centered)
    // currently only done for sections: (".sec-0").parent().parent()
    // so any other items using a slider element are ignored
    var slider_list_left = "35";
    if ($(window).width() < 540) {
      slider_list_left = "20";
    }
    $(".sec-0").parent().parent()
              .css("margin-left", slider_list_left + "%");
    return items;
  },


  render: function() {
  	if (this.props.content.length == 1) {
  		return <div style={{marginBottom: "-30px !important"}}>{this.props.content[0]}</div>;
  	}

    return (
      <Carousel ref="carousel" data={this.setCarouselData.bind(this, 'carousel')}
        slidesToShow={this.state.num_items} 
        dragging={true}
        cellSpacing={30}>
        {this.props.content}
      </Carousel>
    )
  },

  componentDidMount: function() {
    if (this.props.content.length > 1) {
      this.updateNumItems();
    }

    $(window).resize(function() {
      if (this.props.content.length <= 1) {return;}
      this.updateNumItems();
    }.bind(this));
  },


});

