var Carousel = require('nuka-carousel');

module.exports = React.createClass({
  mixins: [Carousel.ControllerMixin],
  render: function() {
  	if (this.props.content.length == 1) {
  		return <div style={{marginBottom: "-30px !important"}}>{this.props.content[0]}</div>;
  	}

    return (
      <Carousel ref="carousel" data={this.setCarouselData.bind(this, 'carousel')}
        slidesToShow={this.props.slidesToShow} dragging={true}>
        {this.props.content}
      </Carousel>
    )
  }
});

