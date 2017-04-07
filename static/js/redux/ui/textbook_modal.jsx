import React from "react";
import Modal from "boron/WaveModal";
import Textbook from "./textbook.jsx";

export class TextbookModal extends React.Component {
    componentDidMount() {
        if (this.props.isVisible)
            this.refs.modal.show();
    }

    componentDidUpdate(nextProps) {
        if (this.props.isVisible) {
            this.refs.modal.show();
        }
    }

    render() {
        let modalHeader =
            <div id="modal-header">
                <h1>Your Textbooks</h1>
                <div id="modal-close" onClick={() => this.refs.modal.hide()}>
                    <i className="fa fa-times"></i>
                </div>
            </div>
        let modalStyle = {
            width: '100%'
        };

        let tbs = {};
        let all_tbs = []
        for (let i = 0; i < this.props.liveTimetableCourses.length; i++) {
            tbs[this.props.liveTimetableCourses[i].name] = []
            if (this.props.liveTimetableCourses[i].textbooks !== undefined && Object.keys(this.props.liveTimetableCourses[i].textbooks).length > 0) {
                for (let j = 0; j < this.props.liveTimetableCourses[i].enrolled_sections.length; j++) {
                    tbs[this.props.liveTimetableCourses[i].name] = tbs[this.props.liveTimetableCourses[i].name].concat(this.props.liveTimetableCourses[i].textbooks[this.props.liveTimetableCourses[i].enrolled_sections[j]]);
                    all_tbs = all_tbs.concat(this.props.liveTimetableCourses[i].textbooks[this.props.liveTimetableCourses[i].enrolled_sections[j]]);
                }
            }
        }

        let keys = Object.keys(tbs).sort(function (a, b) {
            return tbs[b].length - tbs[a].length;
        });
        let textbookList = keys.map((course_name) =>
            <div key={course_name} className="tb-list-entry">
                <h3 className="modal-module-header">{course_name}</h3>
                {
                    tbs[course_name].length > 0 ? _.uniq(tbs[course_name], 'isbn').map(tb =>
                        <Textbook tb={tb} key={tb.isbn}/>) :
                        <p className="no-tbs">No textbooks found for this course.</p>
                }
            </div>
        );

        let exists = (x) => x && x.length > 0 && x != "Cannot be found";

        let footer = (
            <div className='modal-footer'>
                {
                    all_tbs.length > 0 ? (
                        <div>
                            <p>Click any textbook to view purchasing options on Amazon, or add to your Amazon cart for a
                                quick checkout</p>
                            <button id="add-to-cart" type="submit" form="aws-cart-form" value="Submit">
                                <div className="button-label">
                                    <i className="fa fa-amazon" aria-hidden="true"/>
                                    <span>Add to Cart</span>
                                </div>
                            </button>
                        </div>) :
                        <p>Signin to view your saved timetables, or check back later to see if textbooks have been
                            added!</p>

                }
            </div>
        )

        let textbookForm = (
            <form id="aws-cart-form" method="GET" action="https://www.amazon.com/gp/aws/cart/add.html" target="_blank">
                <input type="hidden" name="AWSAccessKeyId" value="***REMOVED***"/>
                <input type="hidden" name="AssociateTag" value="semesterly-20"/>
                <div id="tb-list-container">
                    {textbookList}
                    {
                        _.range(all_tbs.length).map(idx => {
                            let tb = all_tbs[idx];
                            if (!exists(tb.detail_url)) {
                                return null;
                            }
                            let asin = tb.detail_url.match("/([a-zA-Z0-9]{10})(?:[/?]|$|%3F)")[1];
                            return (
                                <div key={asin}>
                                    <input type="hidden" name={"ASIN." + idx + 1 } value={asin}/>
                                    <input type="hidden" name={"Quantity." + idx + 1 } value="1"/>
                                </div>
                            );
                        })
                    }
                </div>

                {footer}

            </form>
        );

        let loader = (
            <div>
                <div id="tb-list-container">
                    <div className="loader-container">
                        <div className="spinner-container">
                            <div className="loader"/>
                        </div>
                        <p>Your Textbooks are Loading</p>
                    </div>
                </div>
                {footer}
            </div>
        );

        let emptyState = (
            <div>
                <div id="tb-list-container">
                    <div className="loader-container">
                        <div className="spinner-container">
                            <i className="done fa fa-check"/>
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
        } else if (all_tbs.length == 0) {
            modalContent = emptyState;
        } else {
            modalContent = textbookForm;
        }

        return (
            <Modal ref="modal"
                   className="textbook-modal abnb-modal max-modal"
                   modalStyle={modalStyle}
                   onHide={() => {
                       this.props.toggleTextbookModal();
                       history.replaceState({}, 'Semester.ly', '/');
                   }}
            >

                <div id="modal-content">
                    { modalHeader }

                    { modalContent }
                </div>


            </Modal>
        );
    }
}
