import React from 'react';
import Carousel from '../../modules/nuka-carousel/carousel';

// eslint-disable-next-line
const SideScroller = React.createClass({

  propTypes: {
    content: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,
    id: React.PropTypes.string.isRequired,
    navItems: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,
    slideIndex: React.PropTypes.number,
  },

  mixins: [Carousel.ControllerMixin],

  getDefaultProps() {
    return { slideIndex: 0 };
  },


  getInitialState() {
    return { slidesShownCount: 1 };
  },


  render() {
    if (this.props.content.length <= 2) {
      return <div style={{ marginBottom: '-30px !important' }}>{this.props.content}</div>;
    }
    let navItems = null;
    if (this.props.navItems && this.state.carousels.carousel) {
      const navs = [];

      for (let i = 0; i < this.props.navItems.length; i++) {
        const cls = this.state.carousels.carousel.state.currentSlide === i ?
          ' nav-item-active' : '';
        navs.push(
          <span
            key={i} className={`nav-item${cls}`}
            onClick={() => this.state.carousels.carousel.goToSlide(i)}
          >{this.props.navItems[i]}</span>,
                );
      }
      navItems = <div className="scroll-nav">{navs}</div>;
    }
    const slideIndex = this.props.slideIndex ? this.props.slideIndex : 0;
    return (
      <div>
        {navItems}
        <Carousel
          // eslint-disable-next-line
          ref="carousel" data={this.setCarouselData.bind(this, 'carousel')}
          slidesToShow={this.state.slidesShownCount}
          slideIndex={slideIndex}
          dragging
          cellSpacing={30}
          id={this.props.id}
        >
          {this.props.content}
        </Carousel>
      </div>
    );
  },

});

export default SideScroller;
