import PropTypes from 'prop-types';
import React from 'react';
import InputRange from './react_input_range';

class TimeSelector extends React.Component {

  componentDidMount() {
    // eslint-disable-next-line
    $('.InputRange-labelContainer').filter((i, c) => i % 2 === 0)
      .addClass('InputRange-labelMaxTime');
  }

  render() {
    const { day, value, onChange, onChangeComplete, remove } = this.props;
    return (<div className="time-selector">
      <span className="time-selector-day"> <i
        className="fa fa-times"
        onClick={() => remove(day)}
      />{ day.slice(0, 3) } </span>
      <InputRange
        day={day}
        maxValue={24}
        minValue={8}
        value={value}
        onChange={onChange}
        onChangeComplete={onChangeComplete}
      />
    </div>);
  }
}

TimeSelector.propTypes = {
  day: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onChangeComplete: PropTypes.func.isRequired,
  remove: PropTypes.func.isRequired,
  value: PropTypes.shape({
    max: PropTypes.number.isRequired,
    min: PropTypes.number.isRequired,
  }).isRequired,
};

export default TimeSelector;

