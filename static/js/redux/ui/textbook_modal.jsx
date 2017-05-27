import React from 'react';
import Modal from 'boron/WaveModal';
import Textbook from './textbook';
import * as PropTypes from '../constants/propTypes';

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
    for (let i = 0; i < this.props.liveTimetableCourses.length; i++) {
      tbs[this.props.liveTimetableCourses[i].name] = [];
      if (this.props.liveTimetableCourses[i].textbooks !== undefined &&
        Object.keys(this.props.liveTimetableCourses[i].textbooks).length > 0) {
        for (let j = 0; j < this.props.liveTimetableCourses[i].enrolled_sections.length; j++) {
          tbs[this.props.liveTimetableCourses[i].name] =
            tbs[this.props.liveTimetableCourses[i].name]
              .concat(this.props.liveTimetableCourses[i]
                .textbooks[this.props.liveTimetableCourses[i].enrolled_sections[j]],
              );
          allTbs = allTbs.concat(this.props.liveTimetableCourses[i]
            .textbooks[this.props.liveTimetableCourses[i].enrolled_sections[j]]);
        }
      }
    }

    const keys = Object.keys(tbs).sort((a, b) => tbs[b].length - tbs[a].length);
    const textbookList = keys.map(courseName =>
      <div key={courseName} className="tb-list-entry">
        <h3 className="modal-module-header">{courseName}</h3>
        {
                    tbs[courseName].length > 0 ? _.uniq(tbs[courseName], 'isbn').map(tb =>
                      <Textbook tb={tb} key={tb.isbn} />) :
                    <p className="no-tbs">No textbooks found for this course.</p>
                }
      </div>,
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
        <input type="hidden" name="AWSAccessKeyId" value="***REMOVED***" />
        <input type="hidden" name="AssociateTag" value="semesterly-20" />
        <div className="tb-list-container">
          {textbookList}
          {
                        _.range(allTbs.length).map((idx) => {
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
      <Modal
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


      </Modal>
    );
  }
}

TextbookModal.propTypes = {
  isVisible: React.PropTypes.bool.isRequired,
  isLoading: React.PropTypes.bool.isRequired,
  toggleTextbookModal: React.PropTypes.func.isRequired,
  liveTimetableCourses: React.PropTypes.arrayOf(PropTypes.course).isRequired,
};

export default TextbookModal;
