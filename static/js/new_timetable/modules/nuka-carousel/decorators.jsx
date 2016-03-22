'use strict';


var DefaultDecorators = [
  {
    component: React.createClass({
      render() {

        var disabled = (this.props.currentSlide===0) ?
        "disabled" : "available";
        return (
          <button
            className={disabled}
            style={this.getButtonStyles()}
            onClick={this.props.previousSlide}>{"<"}</button>
        )
      },
      getButtonStyles() {
        return {
          border: 0,
          height: "130px",
          width: "35px",
          color: 'white',
          padding: 10,
          outline: 0,
          cursor: 'pointer'
        }
      }
    }),
    position: 'CenterLeft'
  },
  {
    component: React.createClass({
      render() {
        var disabled = (this.props.currentSlide + this.props.slidesToScroll >= this.props.slideCount) ?
        "disabled" : "available";
        return (
          <button
            className={disabled}
            style={this.getButtonStyles()}
            onClick={this.props.nextSlide}>{">"}</button>
        )
      },
      getButtonStyles() {
        return {
          border: 0,
          height: "130px",
          width: "35px",
          color: 'white',
          padding: 10,
          outline: 0,
          cursor: 'pointer'
        }
      }
    }),
    position: 'CenterRight'
  },
  {
    component: React.createClass({
      render() {
        var self = this;
        var indexes = this.getIndexes(self.props.slideCount, self.props.slidesToScroll);
        return (
          <ul style={self.getListStyles()}>
            {
              indexes.map(function(index) {
                return (
                  <li style={self.getListItemStyles()} key={index}>
                    <button
                      style={self.getButtonStyles(self.props.currentSlide === index)}
                      onClick={self.props.goToSlide.bind(null, index)}>
                      &bull;
                    </button>
                  </li>
                )
              })
            }
          </ul>
        )
      },
      getIndexes(count, inc) {
        var arr = [];
        for (var i = 0; i < count; i += inc) {
          arr.push(i);
        }
        return arr;
      },
      getListStyles() {
        return {
          position: 'relative',
          margin: 0,
          top: -10,
          padding: 0
        }
      },
      getListItemStyles() {
        return {
          listStyleType: 'none',
          display: 'inline-block'
        }
      },
      getButtonStyles(active) {
        return {
          border: 0,
          background: 'transparent',
          color: 'black',
          cursor: 'pointer',
          padding: 10,
          outline: 0,
          fontSize: 24,
          opacity: active ? 1 : 0.5
        }
      }
    }),
    position: 'BottomCenter'
  }
];

module.exports = DefaultDecorators;