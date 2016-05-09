import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import fetch from 'isomorphic-fetch';
import { getSchool } from '../init.jsx';
import Modal from 'boron/DropModal';

export class CourseModal extends React.Component {
    componentWillReceiveProps(nextProps) { 
        if (nextProps.id != null) {
            this.refs.modal.show();
        }
    }
    addCourse() {
        this.props.addCourse(this.props.id);
        this.refs.modal.hide();
    }
    render() {
        let modalStyle = {
            width: '100%',
            heigh: '80%'
        };

        let inRoster = this.props.inRoster;
        let content = this.props.isFetching ? <div className="modal-loader"></div> :
        (<div id="modal-content">
            <div id="modal-header">
                <h1>{this.props.data.name}</h1>
                <h2>{this.props.data.code}, Applied Mathematics and Statistics </h2>
                <div id="modal-close" onClick={() => this.refs.modal.hide()}>
                    <i className="fa fa-times"></i>
                </div>
                <div id="modal-share">
                    <i className="fa fa-share-alt"></i>
                </div>
                <div id="modal-save">
                    <i className="fa fa-bookmark"></i>
                </div>
                <div id="modal-add" 
                    className={classNames('search-course-add', {'in-roster': inRoster})}
                    onClick={this.addCourse.bind(this)}>
                    <i className={classNames('fa', {'fa-plus' : !inRoster, 'fa-check' : inRoster})}></i>
                </div>
            </div>
            <div id="modal-body" className="cf">
                <div className="col-1-4">
                    <div className="credits">
                        <h3>3</h3>
                        <h4>credits</h4>
                    </div>
                    <div className="rating-module">
                        <h4>Average Course Rating</h4>
                        <div className="sub-rating-wrapper">
                            <div className="star-ratings-sprite">
                                <span></span>
                            </div>
                        </div>
                    </div>
                    <p>{this.props.data.prerequisites}</p>
                </div>
                <div className="col-1-2">
                    <p>{this.props.data.description}</p>
                </div>
                <div id="modal-section-lists"
                    className="col-1-4">
                    <h3>Lecture Sections</h3>
                    <div className="modal-section"></div>
                    <h3>Tutorial Sections</h3>
                    <h3>Practicals Sections</h3>
                </div>
            </div>
        </div>);
        return (
            <Modal ref="modal"
                className="course-modal"
                modalStyle={modalStyle}
                onHide={this.props.hideModal}
                >
                {content}
            </Modal>
        );
    }
}
