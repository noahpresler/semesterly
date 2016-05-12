import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import fetch from 'isomorphic-fetch';
import { getSchool } from '../init.jsx';
import Modal from 'boron/DropModal';
import { CourseModalBody } from './course_modal_body.jsx'

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
    sizeItUp() {
        let h = $("#modal-header").outerHeight();
        $("#modal-body").css("top", h);
    }
    componentDidMount() {
        $(window).resize(this.sizeItUp);
    }
    componentDidUpdate() {
        this.sizeItUp();
    }
   
    render() {
        let modalStyle = {
            width: '100%',
            backgroundColor: 'transparent'
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
            <CourseModalBody {...this.props} />
        </div>);
        return (
            <Modal ref="modal"
                className={classNames('course-modal', {'trans' : this.props.hasHoveredResult})}                 
                modalStyle={modalStyle}
                onHide={this.props.hideModal}
                >
                {content}
            </Modal>
        );
    }
}
