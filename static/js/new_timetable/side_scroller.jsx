var Carousel = require('./modules/nuka-carousel/carousel');

module.exports = React.createClass({
  mixins: [Carousel.ControllerMixin],

  getInitialState: function() {
    return {slides_shown_count: 1};
  },
  updateNumItems: function() {

    if (!this.props.slidesToShow || $(".slider").length == 0 || !this.isMounted()) {
      return;
    }
    var width = $(".slider").width();
    var section_width = $(".section-wrapper").width() + 15;
    var count = Math.max(2, parseInt(width/section_width));
    this.setState({slides_shown_count: count});

    // move slider list left (so that first item is centered).
    // currently only done for sections: (".sec-0").parent().parent()
    // so any other items using a slider element are ignored
    var slider_list_left = "35";
    if ($(window).width() < 540) {
      slider_list_left = "20";
    }
    $(".sec-0").parent().parent()
              .css("margin-left", slider_list_left + "%");
    return count;
  },


  render: function() {
  	if (this.props.content.length <= 2) {
  		return <div style={{marginBottom: "-30px !important"}}>{this.props.content}</div>;
  	}
    var nav_items = null;
    if (this.props.nav_items && this.state.carousels.carousel) {
      var navs = [];

      for (var i = 0; i < this.props.nav_items.length; i++) {
        var cls = this.state.carousels.carousel.state.currentSlide == i ? " nav-item-active" : "";
        navs.push(
          <span key={i} className={"nav-item" + cls} onClick={this.changeSlide(i)}>{this.props.nav_items[i]}</span>
        );
      }
      nav_items = <div className="scroll-nav">{navs}</div>;
    }

    return (
      <div>
        {nav_items}
        <Carousel ref="carousel" data={this.setCarouselData.bind(this, 'carousel')}
          slidesToShow={this.state.slides_shown_count} 
          dragging={true}
          cellSpacing={30}
          id={this.props.id}>
          {this.props.content}
        </Carousel>
      </div>
    )
  },
  // changes the currently selected slide to slide i (indexed starting at 0)
  changeSlide: function(i) {
    return function() {
      var new_carousels = jQuery.extend(true, {}, this.state.carousels);
      new_carousels.carousel.state.currentSlide = i;
      this.setState({carousels: new_carousels});
    }.bind(this);

  },

  componentDidMount: function() {
    var length = this.props.content.length;
    if (length > 1) {
      this.updateNumItems();
      if (length > 2 && this.props.id == "sections-carousel") {
        $(".slider-decorator-1 > .sections-carousel").click() // make third section default to middle of slider
      }
    }

    $(window).resize(function() {
      if (length <= 1) {return;}
      this.updateNumItems();
    }.bind(this));
  },


});

