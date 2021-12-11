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
import classnames from 'classnames';
import renderHTML from 'react-render-html';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

class Evaluation extends React.Component {
  render() {
    const { evalData } = this.props;
    let details = null;
    let prof = null;

    if (!this.props.mini) { // only show extra information if this eval isn't mini
      // (i.e. full evaluation, not nav item for full evaluations)
      const s = `<p>${evalData.summary.replace(/\u00a0/g, ' ').replace(/\n/g, '<br />')}</p>`;
      details = (
        <div className="eval-item__details">
          {renderHTML(s)}
        </div>
      );
      prof = (
        <div className="eval-item__prof"><b>Professor: {evalData.professor}</b></div>
      );
    }

    // extract last name (if present)
    const shortProfName = (name) => {
      if (!name) {
        return '';
      }

      const wrapParen = s => ` (${s})`;

      const words = name.split(/\s+/).filter(n => n !== '');

      if (words.length === 0) {
        return '';
      } else if (words.length >= 2) {
        return wrapParen(words[1]);
      }
      return wrapParen(words[0]);
    };

    const year = evalData.year.indexOf(':') > -1 ?
      evalData.year.replace(':', ' ') :
      evalData.year;
    return (
      <div
        className={classnames('eval-item', {
          mini: this.props.mini,
          selected: !this.props.mini,
        })}
      >
        <div className="eval-wrapper">
          <div className="year truncate">
            <b>
              {year}
              {!evalData.unique_term_year &&
                            shortProfName(evalData.professor)
              }
            </b>
          </div>
          {prof}
          <div className="rating-wrapper">
            <div className="star-ratings-sprite eval-stars">
              <span
                style={{ width: `${(100 * evalData.score) / 5}%` }}
                className="rating"
              />
            </div>
            <div className="numeric-rating"><b>{`(${evalData.score})`}</b></div>
          </div>
        </div>
        {details}
      </div>);
  }
}

Evaluation.defaultProps = {
  mini: false,
};

Evaluation.propTypes = {
  mini: PropTypes.bool,
  evalData: SemesterlyPropTypes.evaluation.isRequired,
};

export default Evaluation;

