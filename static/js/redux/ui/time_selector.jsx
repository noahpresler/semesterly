import PropTypes from 'prop-types';
import React from 'react';
import InputRange from 'react-input-range';

class TimeSelector extends React.Component {

  componentDidMount() {
    $('.input-range__label-container').filter(i => i % 2 === 0)
      .addClass('input-range__label--max-time');
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

