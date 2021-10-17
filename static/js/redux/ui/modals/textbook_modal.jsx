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
import uniqBy from 'lodash/uniqBy';
import range from 'lodash/range';
import { WaveModal } from 'boron-15';
import Textbook from '../textbook';
import * as SemesterlyPropTypes from '../../constants/semesterlyPropTypes';

class TextbookModal extends React.Component {
  componentDidMount() {
    if (this.props.isVisible) {
      this.modal.show();
    }
  }

  componentDidUpdate() {
    if (this.props.isVisible) {
      this.modal.show();
    }
  }

  render() {
    const modalHeader =
            (<div className="modal-header">
              <h1>Your Textbooks</h1>
              <div className="modal-close" onClick={() => this.modal.hide()}>
                <i className="fa fa-times" />
              </div>
            </div>);
    const modalStyle = {
      width: '100%',
    };

    const tbs = {};
    let allTbs = [];
    // TODO: use forEach instead
    for (let i = 0; i < this.props.courses.length; i++) {
      tbs[this.props.courses[i].name] = [];
      if (this.props.courses[i].textbooks !== undefined &&
        Object.keys(this.props.courses[i].textbooks).length > 0) {
        for (let j = 0; j < this.props.courses[i].sections.length; j++) {
          tbs[this.props.courses[i].name] =
            tbs[this.props.courses[i].name]
              .concat(this.props.courses[i]
                .textbooks[this.props.courses[i].sections[j].meeting_section],
              );
          allTbs = allTbs.concat(this.props.courses[i]
            .textbooks[this.props.courses[i].sections[j].meeting_section]);
        }
      }
    }

    const keys = Object.keys(tbs).sort((a, b) => tbs[b].length - tbs[a].length);
    const textbookList = keys.map(courseName =>
      (<div key={courseName} className="tb-list-entry">
        <h3 className="modal-module-header">{courseName}</h3>
        {
                    tbs[courseName].length > 0 ? uniqBy(tbs[courseName], tb => tb.isbn).map(tb =>
                      <Textbook tb={tb} key={tb.isbn} />) :
                    <p className="no-tbs">No textbooks found for this course.</p>
                }
      </div>),
        );

    const exists = x => x && x.length > 0 && x !== 'Cannot be found';

    const footer = (
      <div className="modal-footer">
        {
                    allTbs.length > 0 ? (
                      <div>
                        <p>Click any textbook to view purchasing options on Amazon, or add to
                                your Amazon cart for a
                                quick checkout</p>
                        <button
                          className="add-to-cart" type="submit" form="aws-cart-form"
                          value="Submit"
                        >
                          <div className="button-label">
                            <i className="fa fa-amazon" aria-hidden="true" />
                            <span>Add to Cart</span>
                          </div>
                        </button>
                      </div>) :
                      <p>Signin to view your saved timetables, or check back later to see if
                            textbooks have been
                            added!</p>

                }
      </div>
        );

    const textbookForm = (
      <form
        id="aws-cart-form" method="GET"
        action="https://www.amazon.com/gp/aws/cart/add.html" target="_blank"
      >
        <input type="hidden" name="AWSAccessKeyId" value="AKIAJGUOXN3COOYBPTHQ" />
        <input type="hidden" name="AssociateTag" value="semesterly-20" />
        <div className="tb-list-container">
          {textbookList}
          {
                        range(allTbs.length).map((idx) => {
                          const tb = allTbs[idx];
                          if (!exists(tb.detail_url)) {
                            return null;
                          }
                          const asin = tb.detail_url.match('/([a-zA-Z0-9]{10})(?:[/?]|$|%3F)')[1];
                          return (
                            <div key={asin}>
                              <input type="hidden" name={`ASIN.${idx}${1}`} value={asin} />
                              <input type="hidden" name={`Quantity.${idx}${1}`} value="1" />
                            </div>
                          );
                        })
                    }
        </div>

        {footer}

      </form>
        );

    const loader = (
      <div>
        <div className="tb-list-container">
          <div className="loader-container">
            <div className="spinner-container">
              <div className="loader" />
            </div>
            <p>Your Textbooks are Loading</p>
          </div>
        </div>
        {footer}
      </div>
        );

    const emptyState = (
      <div>
        <div className="tb-list-container">
          <div className="loader-container">
            <div className="spinner-container">
              <i className="done fa fa-check" />
            </div>
            <p>We found no textbooks for the courses on your schedule!</p>
          </div>
        </div>
        {footer}
      </div>
        );

    let modalContent = null;
    if (this.props.isLoading) {
      modalContent = loader;
    } else if (allTbs.length === 0) {
      modalContent = emptyState;
    } else {
      modalContent = textbookForm;
    }

    return (
      <WaveModal
        ref={(c) => { this.modal = c; }}
        className="textbook-modal abnb-modal max-modal"
        modalStyle={modalStyle}
        onHide={() => {
          this.props.toggleTextbookModal();
          history.replaceState({}, 'Semester.ly', '/');
        }}
      >

        <div className="modal-content">
          { modalHeader }

          { modalContent }
        </div>


      </WaveModal>
    );
  }
}

TextbookModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  toggleTextbookModal: PropTypes.func.isRequired,
  courses: PropTypes.arrayOf(SemesterlyPropTypes.denormalizedCourse).isRequired,
};

export default TextbookModal;

