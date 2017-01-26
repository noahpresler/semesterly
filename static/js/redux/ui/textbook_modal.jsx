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
        for (let i = 0; i < this.props.liveTimetableCourses.length; i++){
            tbs[this.props.liveTimetableCourses[i].name] = []
            if(this.props.liveTimetableCourses[i].textbooks !== undefined && Object.keys(this.props.liveTimetableCourses[i].textbooks).length > 0) {
                for (let j=0; j<this.props.liveTimetableCourses[i].enrolled_sections.length; j++) {
                    tbs[this.props.liveTimetableCourses[i].name].push(this.props.liveTimetableCourses[i].textbooks[this.props.liveTimetableCourses[i].enrolled_sections[j]])
                }
            }
        }

        let modalContent = Object.keys(tbs).map((course_name) =>
            <h3 key={course_name} className="modal-module-header">{course_name}</h3>
        )
        console.log('yo',modalContent);

        return (
            <Modal ref="modal"
                className="textbook-modal abnb-modal max-modal"
                modalStyle={modalStyle}
                onHide={() => {
                    this.props.toggleTextbookModal();
                    history.replaceState( {} , 'Semester.ly', '/');
                }}
                >

                {modalHeader}

                 <div id="tb-list-container">
                    {modalContent}
                </div>

            </Modal>
        );
    }
}
