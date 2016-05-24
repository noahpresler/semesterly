import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import fetch from 'isomorphic-fetch';
import { getSchool } from '../init.jsx';
import Modal from 'boron/DropModal';
import { CourseModalBody } from './course_modal_body.jsx'
import { getCourseShareLink } from '../helpers/timetable_helpers.jsx';
import { ShareLink } from './master_slot.jsx';

export class CourseModal extends React.Component {
    constructor(props) {
        super(props);
        this.addOrRemoveCourse = this.addOrRemoveCourse.bind(this);
        this.hide = this.hide.bind(this);
        this.state = { shareLinkShown: false }
        this.showShareLink = this.showShareLink.bind(this);
        this.hideShareLink = this.hideShareLink.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.id != null) {
            this.refs.modal.show();
        }
    }
    addOrRemoveCourse(id, section='') {
        this.props.addOrRemoveCourse(id, section);
        this.hide();
    }
    showShareLink() {
        this.setState({shareLinkShown: true});
    }
    hideShareLink() {
        this.setState({shareLinkShown: false});
    }
    // sizeItUp() {
    //     let h = $("#modal-header").outerHeight();
    //     $("#modal-body").css("top", h);
    // }
    // componentDidMount() {
    //     $(window).resize(this.sizeItUp);
    // }
    // componentDidUpdate() {
    //     this.sizeItUp();
    // }
    hide() {
        this.props.unhoverSection();
        this.props.hideModal();
        this.refs.modal.hide();
    }

    render() {
        let modalStyle = {
            width: '100%',
            backgroundColor: 'transparent'
        };
        let { data, inRoster } = this.props;
        let courseAndDept = data.code;
        courseAndDept = data.department && data.department != "" ?
        courseAndDept + ", " + data.department : courseAndDept;
        let shareLink = this.state.shareLinkShown ? 
        <ShareLink 
            link={getCourseShareLink(data.code)}
            onClickOut={this.hideShareLink} /> : 
        null;

        let add = data.sections !== undefined && Object.keys(data.sections).length > 0 ? <div id="modal-add"
                    className={classNames('search-course-add', {'in-roster': inRoster})}
                    onClick={() => this.addOrRemoveCourse(this.props.id)}>
                    <i className={classNames('fa', {'fa-plus' : !inRoster, 'fa-check' : inRoster})}></i>
                </div> : null;
        let content = 
        (<div id="modal-content">
            <div id="modal-header">
                <h1>{data.name}</h1>
                <h2>{courseAndDept}</h2>
                <div id="modal-close" onClick={() => this.refs.modal.hide()}>
                    <i className="fa fa-times"></i>
                </div>
                <div id="modal-share">
                    <i className="fa fa-share-alt" onClick={this.showShareLink}></i>
                </div>
                { shareLink }

                <div id="modal-save">
                    <i className="fa fa-bookmark"></i>
                </div>
                { add }
                
            </div>
            <CourseModalBody {...this.props} hideModal={this.hide} addOrRemoveCourse={this.addOrRemoveCourse}/>
        </div>);
        return (
            <Modal ref="modal"
                className={classNames('course-modal', {'trans' : this.props.hasHoveredResult})}
                modalStyle={modalStyle}
                onHide={this.hide}
                >
                {content}
            </Modal>
        );
    }
}
