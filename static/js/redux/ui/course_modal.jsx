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
    mapSectionsToSlots(sections) {
        if (sections === undefined) {
            return [];
        }
        // console.log(sections);
        // srs = []
        // for key in Object.keys(sections):
        //     srs.append(<SearchResultSection section={sec} />)

        return Object.keys(sections).map(sec =>
            <SearchResultSection key={sec} section={sec} />
        );
    }
    render() {
        let modalStyle = {
            width: '100%',
            heigh: '80%'
        };
        let inRoster = this.props.inRoster;
        let lecs = this.mapSectionsToSlots(this.props.lectureSections);
        let tuts = this.mapSectionsToSlots(this.props.tutorialSections);
        let pracs = this.mapSectionsToSlots(this.props.practicalSections);
        let lectureSections = null;
        let tutorialSections = null;
        let practicalSections = null;
        if (lecs.length > 0) {
            lectureSections = <div><h3 className="modal-module-header">Lecture Sections</h3>{lecs}</div>
        }
        if (tuts.length > 0) {
            tutorialSections = <div><h3 className="modal-module-header">Tutorial Sections</h3>{tuts}</div>
        }
        if (pracs.length > 0) {
            practicalSections = <div><h3 className="modal-module-header">Practical Sections</h3>{pracs}</div>
        }
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
            <div id="modal-body">
                <div className="cf">
                    <div className="col-3-16">
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
                        <div>
                            <h3 className="modal-module-header">Prerequisites</h3>

                        </div>
                        <div>
                            <h3 className="modal-module-header">Similar Courses</h3>

                        </div>
                    </div>
                    <div className="col-8-16">
                        <div>
                            <h3 className="modal-module-header">Course Description</h3>
                            <p>{this.props.data.description}</p>
                        </div>
                        <div>
                            <h3 className="modal-module-header">Course Evaluations</h3>

                        </div>
                        <div>
                            <h3 className="modal-module-header">Textbook</h3>

                        </div>
                    </div>
                    <div id="modal-section-lists"
                        className="col-5-16 cf">
                        {lectureSections}
                        {tutorialSections}
                        {practicalSections}
                    </div>
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

const SearchResultSection = ({ section }) => {
    // following classname in "h6 span" Red for no seats left, green for available seats
    return (
    <div className="modal-section">
        <h4>{section}</h4>
        <h5>Johns Smithson</h5>
        <h5>Gilman Hall</h5>
        <h6><span className="red">0 open</span> / 365 seats</h6>
    </div>
    );
};
