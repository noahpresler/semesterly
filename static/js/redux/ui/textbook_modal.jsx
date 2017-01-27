import React from 'react';
import Modal from 'boron/WaveModal';
import classNames from 'classnames';
import Textbook from './textbook.jsx';

export class TextbookModal extends React.Component {
    componentDidMount() {
        if (true || this.props.isVisible)
            this.refs.modal.show();
    }
	componentDidUpdate(nextProps) {
		if (this.props.isVisible) {
			this.refs.modal.show();
		}
	}
	render() {
        let modalHeader =
            <div id="modal-content">
                <div id="modal-header">
                    <h1>Your Textbooks</h1>
                </div>
            </div>
        let modalStyle = {
            width: '100%'
        };

        let tbs = {};
        let all_tbs = []
        for (let i = 0; i < this.props.liveTimetableCourses.length; i++){
            tbs[this.props.liveTimetableCourses[i].name] = []
            if(this.props.liveTimetableCourses[i].textbooks !== undefined && Object.keys(this.props.liveTimetableCourses[i].textbooks).length > 0) {
                for (let j=0; j<this.props.liveTimetableCourses[i].enrolled_sections.length; j++) {
                    tbs[this.props.liveTimetableCourses[i].name] = tbs[this.props.liveTimetableCourses[i].name].concat(this.props.liveTimetableCourses[i].textbooks[this.props.liveTimetableCourses[i].enrolled_sections[j]]);
                    all_tbs = all_tbs.concat(this.props.liveTimetableCourses[i].textbooks[this.props.liveTimetableCourses[i].enrolled_sections[j]]);
                }
            }
        }

        let modalContent = Object.keys(tbs).map((course_name) => 
            <div key={course_name} className="tb-list-entry">
                <h3 className="modal-module-header">{course_name}</h3>
                {
                    _.uniq(tbs[course_name], 'isbn').map(tb =>
                    <Textbook tb={tb} key={tb.isbn} />
                )}
            </div>
        );

        const exists = (x) => x && x.length > 0 && x != "Cannot be found";

        return (
            <Modal ref="modal"
                className="textbook-modal abnb-modal max-modal"
                modalStyle={modalStyle}
                onHide={() => {
                    this.props.toggleTextbookModal();
                    history.replaceState( {} , 'Semester.ly', '/');
                }}
                >

                { modalHeader }

                <form id="aws-cart-form" method="GET" action="https://www.amazon.com/gp/aws/cart/add.html"> 
                    <input type="hidden" name="AWSAccessKeyId" value="***REMOVED***" />
                    <input type="hidden" name="AssociateTag" value="semesterly-20" />
                     <div id="tb-list-container">
                        {modalContent}
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

                    <div className='modal-footer'>
                        <p>Click any textbook to view purchasing options on Amazon, or add to your Amazon cart for a quick checkout</p>
                        <button id="add-to-cart" type="submit" form="aws-cart-form" value="Submit">
                            <div className="button-label">
                                <i className="fa fa-amazon" aria-hidden="true"/>
                                <span>Add to Cart</span>
                            </div>
                        </button>
                    </div>
                </form>

            </Modal>
        );
    }
}
