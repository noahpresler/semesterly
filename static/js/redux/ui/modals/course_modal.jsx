/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import Clipboard from 'clipboard';
import {WaveModal} from 'boron-15';
import { AreaBubble, WritingIntensive } from '../search_result';
import CourseModalBodyContainer from '../containers/modals/course_modal_body_container';
import { ShareLink } from '../master_slot';
import { normalizedCourse } from '../../constants/semesterlyPropTypes';

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
    const wasFetching = this.props.isFetching || this.props.isFetchingClasmates;
    const isFetching = nextProps.isFetching || nextProps.isFetchingClasmates;
    // wait for both classmates and course info to be finished fetching
    if (wasFetching && !isFetching) {
      const { data } = nextProps;
      if (data.code) {
        history.replaceState({}, 'Semester.ly', this.props.getShareLinkFromModal(data.code));
      }
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
    const idEventTarget = '#clipboard-btn-modal';
    const clipboard = new Clipboard(idEventTarget);
    clipboard.on('success', () => {
      $(idEventTarget).addClass('clipboardSuccess').text('Copied!');
    });
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
    const courseAndDept = data.department && data.department !== '' ?
      (<div>{data.code}, {data.department} </div>) : data.code;
    const shareLink = this.state.shareLinkShown ?
            (<ShareLink
              link={this.props.getShareLink(data.code)}
              uniqueId="modal"
              type="Course"
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
        this.addOrRemoveCourse(this.props.data.id);
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
                <h2>
                  <div className="subtitle">
                    {courseAndDept}
                    { data.areas ? <AreaBubble areas={data.areas} /> : null }
                    { data.writing_intensive ?
                      <WritingIntensive isWritingIntensive={data.writing_intensive} /> : null }
                  </div>
                </h2>
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
              <CourseModalBodyContainer
                inRoster={this.props.inRoster}
                data={this.props.data}
                addOrRemoveCourse={this.props.addOrRemoveCourse}
                hideModal={this.props.hideModal}
                isFetching={this.props.isFetching}
                unHoverSection={this.props.unHoverSection}
                getShareLink={this.props.getShareLink}
                getShareLinkFromModal={this.props.getShareLinkFromModal}
              />
            </div>);
    return (
      <WaveModal
        ref={(c) => { this.modal = c; }}
        className={classNames('course-modal max-modal', { trans: this.props.hasHoveredResult })}
        modalStyle={modalStyle}
        onHide={this.hide}
      >
        {content}
      </WaveModal>
    );
  }
}

CourseModal.defaultProps = {
  id: null,
  data: {},
};

CourseModal.propTypes = {
  isFetchingClasmates: PropTypes.bool.isRequired,
  data: PropTypes.oneOfType([normalizedCourse, PropTypes.shape({})]),
  inRoster: PropTypes.bool.isRequired,
  hasHoveredResult: PropTypes.bool.isRequired,
  addOrRemoveOptionalCourse: PropTypes.func.isRequired,
  addOrRemoveCourse: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired,
  unHoverSection: PropTypes.func.isRequired,
  getShareLink: PropTypes.func.isRequired,
  getShareLinkFromModal: PropTypes.func.isRequired,
  // Must be included to be passed down into CourseModalBody, which needs to either refer to
  // state.courseInfo.isFetching or state.explorationModal.isFetching depending on its parent
  isFetching: PropTypes.bool.isRequired,
};

export default CourseModal;

