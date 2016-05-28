import React from 'react';
import Modal from 'boron/DropModal';
import classNames from 'classnames';

export class SignupModal extends React.Component {
	componentDidUpdate(nextProps) {
		if (this.props.isVisible) {
			this.refs.modal.show();
		}
	}
	render() {
        let modalHeader =
            <div id="modal-content">
                <div id="modal-header">
                    <div className="pro-pic" style={{backgroundImage: 'url(/static/img/blank.jpg)'}}></div>
                    <h1>Signup now...</h1>
                </div>
            </div>
        let modalStyle = {
            width: '100%'
        };
        return (
            <Modal ref="modal"
                className="signup-modal"
                modalStyle={modalStyle}
                onHide={this.props.toggleSignupModal}>
                {modalHeader}
                <div id="features">
                    That feature requires an account.
                    <div id="feature-highlight">
                        <div className="row">
                            <div className="col-1-2">
                                <div className="emoji"><i className="fa fa-check"/></div>
                                Find classes with friends
                                <img className="sample-slot" src="/static/img/sample_slot.png"/>
                            </div>
                            <div className="col-1-2">
                                <div className="emoji"><i className="fa fa-check"/></div>
                                Save & name multiple timetables
                                <img className="sample-slot" src="/static/img/multi_tt_sample.png"/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-1-2">
                                <div className="emoji"><i className="fa fa-check"/></div>
                                Create custom events
                                <img className="sample-slot" src="/static/img/sample_custom_slot_grey.png"/>
                            </div>
                            <div className="col-1-2">
                                <div className="emoji" dangerouslySetInnerHTML={{__html: twemoji.parse('\uD83D\uDD25')}}/>
                                It's all free
                                <h1>More Burritos!</h1>
                            </div>
                        </div>
                    </div>
                    <div id="call-to-action">
                        <div className="disclaimer">
                            Semester.ly will NEVER post to your timeline. Your course selections will not be shared with any other user without your permission.
                        </div>
                        <a href="/login/facebook">
                            <div  className="signup-button">
                                Signup!
                            </div>
                        </a>
                    </div>
                </div>
            </Modal>
        );
    }
}
