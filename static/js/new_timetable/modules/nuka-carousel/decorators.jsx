'use strict';

var DefaultDecorators = [{
  component: React.createClass({
    displayName: "component",
    render: function render() {

      var disabled = this.props.currentSlide === 0 ? "disabled" : "available";
      return React.createElement(
        "button",
        {
          className: disabled,
          style: this.getButtonStyles(),
          onClick: this.props.previousSlide },
        "<"
      );
    },
    getButtonStyles: function getButtonStyles() {
      return {
        border: 0,
        height: "130px",
        width: "35px",
        color: 'white',
        padding: 10,
        outline: 0,
        cursor: 'pointer'
      };
    }
  }),
  position: 'CenterLeft'
}, {
  component: React.createClass({
    displayName: "component",
    render: function render() {
      var disabled = this.props.currentSlide + this.props.slidesToScroll >= this.props.slideCount ? "disabled" : "available";
      return React.createElement(
        "button",
        {
          className: disabled,
          style: this.getButtonStyles(),
          onClick: this.props.nextSlide },
        ">"
      );
    },
    getButtonStyles: function getButtonStyles() {
      return {
        border: 0,
        height: "130px",
        width: "35px",
        color: 'white',
        padding: 10,
        outline: 0,
        cursor: 'pointer'
      };
    }
  }),
  position: 'CenterRight'
}, {
  component: React.createClass({
    displayName: "component",
    render: function render() {
      var self = this;
      var indexes = this.getIndexes(self.props.slideCount, self.props.slidesToScroll);
      return React.createElement(
        "ul",
        { style: self.getListStyles() },
        indexes.map(function (index) {
          return React.createElement(
            "li",
            { style: self.getListItemStyles(), key: index },
            React.createElement(
              "button",
              {
                style: self.getButtonStyles(self.props.currentSlide === index),
                onClick: self.props.goToSlide.bind(null, index) },
              "•"
            )
          );
        })
      );
    },
    getIndexes: function getIndexes(count, inc) {
      var arr = [];
      for (var i = 0; i < count; i += inc) {
        arr.push(i);
      }
      return arr;
    },
    getListStyles: function getListStyles() {
      return {
        position: 'relative',
        margin: 0,
        top: -10,
        padding: 0
      };
    },
    getListItemStyles: function getListItemStyles() {
      return {
        listStyleType: 'none',
        display: 'inline-block'
      };
    },
    getButtonStyles: function getButtonStyles(active) {
      return {
        border: 0,
        background: 'transparent',
        color: 'black',
        cursor: 'pointer',
        padding: 10,
        outline: 0,
        fontSize: 24,
        opacity: active ? 1 : 0.5
      };
    }
  }),
  position: 'BottomCenter'
}];

module.exports = DefaultDecorators;
