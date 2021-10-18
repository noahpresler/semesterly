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
import ClickOutHandler from 'react-onclickout';
import classNames from 'classnames';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

export class Filter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { results: this.props.results };
    this.filterResults = this.filterResults.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.show && this.props.show) {
      this.filterInput.focus();
    }
  }

  filterResults(event) {
    const query = event.target.value.toLowerCase();
    if (query === '') {
      this.setState({ results: this.props.results });
    } else {
      const results = this.props.results;
      this.setState({
        results: results.filter(r => r.toLowerCase().includes(query)),
      });
    }
  }

  render() {
    if (!this.props.show) {
      return null;
    }
    const { filterType, schoolSpecificInfo } = this.props;
    const placeholder = schoolSpecificInfo[`${filterType}Name`];
    const results = this.state.results.map((r, i) => (<li
      key={r}
      onClick={() => this.props.add(filterType, r)}
      className={classNames({ loading: this.props.isFetching })}
    >
      <i
        className={classNames({
          fa: true,
          'fa-check': this.props.isFiltered(filterType, r),
        })}
      />
      <h6>{r}</h6>
    </li>));
    return (
      <ClickOutHandler onClickOut={this.props.onClickOut}>
        <div className="filter-pop-out open">
          <input
            ref={(ref) => { this.filterInput = ref; }}
            placeholder={placeholder}
            onInput={this.filterResults}
          />
          <div className="fpo-list">
            <ul>
              { results }
            </ul>
          </div>
        </div>
      </ClickOutHandler>

    );
  }
}

Filter.propTypes = {
  results: PropTypes.arrayOf(PropTypes.string).isRequired,
  show: PropTypes.bool.isRequired,
  filterType: PropTypes.string.isRequired,
  schoolSpecificInfo: SemesterlyPropTypes.schoolSpecificInfo.isRequired,
  add: PropTypes.func.isRequired,
  isFiltered: PropTypes.func.isRequired,
  onClickOut: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
};

// eslint-disable-next-line react/prop-types
export const SelectedFilter = ({ name, remove }) => (
  <h6>
    <i className="fa fa-times" onClick={() => remove()} />
    <span>{ name }</span>
  </h6>
);

SelectedFilter.PropTypes = {
  name: PropTypes.string.isRequired,
  remove: PropTypes.func.isRequired,
};

// eslint-disable-next-line react/prop-types
export const SelectedFilterSection = ({ name, toggle, children }) => (
  <div className="exp-filter-section open">
    <h3 className="exp-header">
      <span>{ name.substring(0, name.length - 1) } Filter</span>
      <i
        className="fa fa-plus"
        onClick={toggle}
      />
    </h3>
    { children.length > 0 ? children : <h6 className="none-selected">None Selected</h6> }
  </div>
);

SelectedFilterSection.propTypes = {
  name: PropTypes.string.isRequired,
  toggle: PropTypes.func.isRequired,
  remove: PropTypes.func.isRequired,
};

