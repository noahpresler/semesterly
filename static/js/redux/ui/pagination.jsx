import PropTypes from 'prop-types';
import React from 'react';

const Bubble = ({ index, active, setActive }) =>
  (<li
    onClick={() => setActive(index)}
    className={active ? 'sem-page active' : 'sem-page'}
  >
    <span>{index + 1}</span>
  </li>);

Bubble.propTypes = {
  index: PropTypes.number.isRequired,
  active: PropTypes.bool.isRequired,
  setActive: PropTypes.func.isRequired,
};

class Pagination extends React.Component {

  static getNumBubbles() {
    const bubbles = $(window).width() > 700 ? 10 : 4;
    return bubbles;
  }

  constructor(props) {
    super(props);
    this.state = { numBubbles: Pagination.getNumBubbles() };
    this.prev = this.prev.bind(this);
    this.next = this.next.bind(this);
    this.resetBubbles = this.resetBubbles.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.resetBubbles);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resetBubbles);
  }

  resetBubbles() {
    this.setState({ numBubbles: Pagination.getNumBubbles() });
  }

  prev() {
    if (this.props.active > 0) {
      this.props.setActive(this.props.active - 1);
    }
  }

  next() {
    if (this.props.active + 1 < this.props.count) {
      this.props.setActive(this.props.active + 1);
    }
  }

  render() {
    const options = [];
    const count = this.props.count;
    const current = this.props.active;

    if (count <= 1) {
      return null;
    } // don't display if there aren't enough schedules
    // round down to nearest multiple of this.props.numBubbles
    const first = current - (current % this.state.numBubbles);
    const limit = Math.min(first + this.state.numBubbles, count);
    for (let i = first; i < limit; i++) {
      options.push(
        <Bubble
          key={i}
          index={i}
          active={this.props.active === i}
          setActive={this.props.setActive}
        />,
            );
    }

    return (
      <div className="sem-pagination">
        <div
          className="sem-pagination-nav"
          onClick={this.prev}
        >
          <i className="fa fa-angle-left sem-pagination-prev sem-pagination-icon" />
        </div>
        <ol className="sem-pages">
          {options}
        </ol>
        <div
          className="sem-pagination-nav"
          onClick={this.next}
        >
          <i className="fa fa-angle-right sem-pagination-next sem-pagination-icon" />
        </div>
      </div>
    );
  }
}

Pagination.propTypes = {
  active: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  setActive: PropTypes.func.isRequired,
};

export default Pagination;

