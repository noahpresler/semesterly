import React from 'react';
import classNames from 'classnames';
import Modal from 'boron/WaveModal';
import CourseModalBody from './course_modal_body';
import { getCourseShareLink, getCourseShareLinkFromModal } from '../helpers/timetable_helpers';
import { ShareLink } from './master_slot';
import { fullCourseDetails } from '../constants/propTypes';

class CourseModal extends React.Component {
  constructor(props) {
    super(props);
    this.addOrRemoveCourse = this.addOrRemoveCourse.bind(this);
    this.addOrRemoveOptionalCourse = this.addOrRemoveOptionalCourse.bind(this);
    this.hide = this.hide.bind(this);
    this.state = {
      shareLinkShown: false,
      addBtnIsHover: false,
    };
    this.showShareLink = this.showShareLink.bind(this);
    this.hideShareLink = this.hideShareLink.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.id !== null) {
      const { data } = nextProps;
      history.replaceState({}, 'Semester.ly', getCourseShareLinkFromModal(data.code));
      this.modal.show();
    }
  }

  addOrRemoveCourse(id, section = '') {
    this.props.addOrRemoveCourse(id, section);
    this.hide();
  }

  addOrRemoveOptionalCourse(course) {
    this.props.addOrRemoveOptionalCourse(course);
    this.hide();
  }

  showShareLink() {
    this.setState({ shareLinkShown: true });
  }

  hideShareLink() {
    this.setState({ shareLinkShown: false });
  }

  hide() {
    history.replaceState({}, 'Semester.ly', '/');
    this.props.unHoverSection();
    this.props.hideModal();
    this.modal.hide();
  }

  render() {
    const modalStyle = {
      width: '100%',
      backgroundColor: 'transparent',
    };
    const { data, inRoster } = this.props;
    let courseAndDept = data.code;
    courseAndDept = data.department && data.department !== '' ?
            `${courseAndDept}, ${data.department}` : courseAndDept;
    const shareLink = this.state.shareLinkShown ?
            (<ShareLink
              link={getCourseShareLink(data.code)}
              onClickOut={this.hideShareLink}
            />) :
            null;
    const addOptional = this.props.inRoster ? null :
            (<div className="modal-save" onClick={() => this.addOrRemoveOptionalCourse(data)}>
              <i className="fa fa-bookmark" />
            </div>);
    const add = data.sections !== undefined && Object.keys(data.sections).length > 0 ? (<div
      className={classNames('modal-add search-course-add', {
        'in-roster': inRoster,
      })}
      onClick={() => {
        this.setState({ addBtnIsHover: false });
        this.addOrRemoveCourse(this.props.id);
      }}
      onMouseEnter={
                () => {
                  this.setState({ addBtnIsHover: true });
                }
            }
      onMouseLeave={
                () => {
                  this.setState({ addBtnIsHover: false });
                }
            }
    >
      <i
        className={classNames('fa', {
          'fa-plus': !inRoster,
          'fa-check': inRoster && !this.state.addBtnIsHover,
          'fa-trash-o': inRoster && this.state.addBtnIsHover,
        })}
      />
    </div>) : null;
    const content =
            (<div className="modal-content">
              <div className="modal-header">
                <h1>{data.name}</h1>
                <h2>{courseAndDept}</h2>
                <div className="modal-close" onClick={() => this.modal.hide()}>
                  <i className="fa fa-times" />
                </div>
                <div className="modal-share">
                  <i className="fa fa-share-alt" onClick={this.showShareLink} />
                </div>
                { shareLink }
                { addOptional }
                { add }
              </div>
              <CourseModalBody
                {...this.props} hideModal={this.hide}
                addOrRemoveCourse={this.addOrRemoveCourse}
              />
            </div>);
    return (
      <Modal
        ref={(c) => { this.modal = c; }}
        className={classNames('course-modal max-modal', { trans: this.props.hasHoveredResult })}
        modalStyle={modalStyle}
        onHide={this.hide}
      >
        {content}
      </Modal>
    );
  }
}

CourseModal.defaultProps = {
  id: null,
  data: {},
};

CourseModal.propTypes = {
  id: React.PropTypes.number,
  data: fullCourseDetails,
  inRoster: React.PropTypes.bool.isRequired,
  hasHoveredResult: React.PropTypes.bool.isRequired,
  addOrRemoveOptionalCourse: React.PropTypes.func.isRequired,
  addOrRemoveCourse: React.PropTypes.func.isRequired,
  hideModal: React.PropTypes.func.isRequired,
  unHoverSection: React.PropTypes.func.isRequired,
};

export default CourseModal;
