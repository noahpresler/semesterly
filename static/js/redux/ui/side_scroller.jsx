import Carousel from "../../modules/nuka-carousel/carousel.jsx";
import React from "react";

const SideScroller = React.createClass({
    mixins: [Carousel.ControllerMixin],

    getInitialState: function () {
        return {slidesShownCount: 1};
    },
    // updateNumItems: function() {
    //   if (!this.props.slidesToShow || $(".slider").length == 0 || !this.isMounted()) {
    //     return;
    //   }
    //   let width = $(".slider").width();
    //   let section_width = $(".section-wrapper").width() + 15;
    //   let count = Math.max(2, parseInt(width/section_width));
    //   this.setState({slidesShownCount: count});

    //   // move slider list left (so that first item is centered).
    //   // currently only done for sections: (".sec-0").parent().parent()
    //   // so any other items using a slider element are ignored
    //   let slider_list_left = "35";
    //   if ($(window).width() < 540) {
    //     slider_list_left = "20";
    //   }
    //   $(".sec-0").parent().parent()
    //             .css("margin-left", slider_list_left + "%");
    //   return count;
    // },


    render: function () {
        if (this.props.content.length <= 2) {
            return <div style={{marginBottom: "-30px !important"}}>{this.props.content}</div>;
        }
        let navItems = null;
        if (this.props.navItems && this.state.carousels.carousel) {
            let navs = [];

            for (let i = 0; i < this.props.navItems.length; i++) {
                let cls = this.state.carousels.carousel.state.currentSlide == i ? " nav-item-active" : "";
                navs.push(
                    <span key={i} className={"nav-item" + cls}
                          onClick={this.changeSlide(i)}>{this.props.navItems[i]}</span>
                );
            }
            navItems = <div className="scroll-nav">{navs}</div>;
        }
        let slideIndex = this.props.slideIndex ? this.props.slideIndex : 0;
        return (
            <div>
                {navItems}
                <Carousel ref="carousel" data={this.setCarouselData.bind(this, 'carousel')}
                          slidesToShow={this.state.slidesShownCount}
                          slideIndex={slideIndex}
                          dragging={true}
                          cellSpacing={30}
                          id={this.props.id}>
                    {this.props.content}
                </Carousel>
            </div>
        )
    },
    // changes the currently selected slide to slide i (indexed starting at 0)
    changeSlide: function (i) {
        return function () {
            this.state.carousels.carousel.goToSlide(i);
        }.bind(this);
    },

    componentDidMount: function () {
        // let length = this.props.content.length;
        // if (length > 1) {
        //   this.updateNumItems();
        // }

        // $(window).resize(function() {
        //   if (length <= 1) {return;}
        //   this.updateNumItems();
        // }.bind(this));
    },

});

export default SideScroller;
