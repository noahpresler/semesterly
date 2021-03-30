/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import PropTypes from 'prop-types';
import React from 'react';

class CreditTicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      actualCredits: parseFloat(this.props.numCredits),
      displayedCredits: parseFloat(this.props.numCredits),
    };
    this.incCredits = this.incCredits.bind(this);
    this.decCredits = this.decCredits.bind(this);
    this.interval = 0;
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ actualCredits: parseFloat(nextProps.numCredits) });
    if (parseFloat(nextProps.numCredits.toFixed(2)) >
      parseFloat(this.state.displayedCredits.toFixed(2))) {
      this.interval = setInterval(this.incCredits, 8);
    } else if (parseFloat(nextProps.numCredits.toFixed(2)) <
      parseFloat(this.state.displayedCredits.toFixed(2))) {
      this.interval = setInterval(this.decCredits, 8);
    }
  }

  incCredits() {
    if (parseFloat(this.state.actualCredits.toFixed(2)) <=
      parseFloat(this.state.displayedCredits.toFixed(2))) {
      return clearInterval(this.interval);
    }
    this.setState({ displayedCredits: this.state.displayedCredits + 0.05 });
    return null;
  }

  decCredits() {
    if (parseFloat(this.state.displayedCredits.toFixed(2)) <=
      parseFloat(this.state.actualCredits.toFixed(2))) {
      return clearInterval(this.interval);
    }
    this.setState({ displayedCredits: this.state.displayedCredits - 0.05 });
    return null;
  }

  render() {
    return (
      <div className="sb-credits">
        <h3>{Math.abs(this.state.displayedCredits).toFixed(2)}</h3>
        <h4>credits</h4>
      </div>
    );
  }
}

CreditTicker.propTypes = {
  numCredits: PropTypes.number.isRequired,
};

export default CreditTicker;

