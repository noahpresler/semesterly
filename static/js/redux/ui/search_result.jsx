import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';


class SearchResult extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hoverAdd: false, hoverSave: false };
    this.addCourseWrapper = this.addCourseWrapper.bind(this);
    this.actionOver = this.actionOver.bind(this);
    this.actionOut = this.actionOut.bind(this);
  }

  addCourseWrapper(course, sec, event) {
    event.stopPropagation(); // stops modal from popping up
    event.preventDefault(); // stops search bar from blurring (losing focus)
    this.props.addCourse(course.id, sec);
  }

  addOptionalCourseWrapper(course, event) {
    event.stopPropagation(); // stops modal from popping up
    event.preventDefault(); // stops search bar from blurring (losing focus)
    this.props.addRemoveOptionalCourse(course);
  }

  actionOver(action) {
    switch (action) {
      case 'ADD':
        this.setState({ hoverAdd: true });
        break;
      case 'SAVE':
        this.setState({ hoverSave: true });
        break;
      default:
        break;
    }
  }

  actionOut(action) {
    switch (action) {
      case 'ADD':
        this.setState({ hoverAdd: false });
        break;
      case 'SAVE':
        this.setState({ hoverSave: false });
        break;
      default:
        break;
    }
  }

  render() {
    const { course, inRoster, inOptionRoster } = this.props;
    const addRemoveButton =
      (<span
        title="Add this course"
        className={classNames('search-course-add', { 'in-roster': inRoster })}
        onMouseDown={event => this.addCourseWrapper(course, '', event)}
        onMouseOver={() => this.actionOver('ADD')}
        onMouseOut={() => this.actionOut('ADD')}
      >
        <i className={classNames('fa', { 'fa-plus': !inRoster, 'fa-check': inRoster })} />
      </span>);
    const addOptionalCourseButton = this.props.inRoster ? null :
      (<span
        title="Add this course as optional"
        className={classNames('search-course-save', { 'in-roster': inOptionRoster })}
        onMouseDown={event => this.addOptionalCourseWrapper(course, event)}
        onMouseOver={() => this.actionOver('SAVE')}
        onMouseOut={() => this.actionOut('SAVE')}
      >
        <i
          className={classNames('fa', {
            'fa-bookmark': !inOptionRoster,
            'fa-check': inOptionRoster,
          })}
        />
      </span>);
    let info = course.name ? course.code : '';
    if (this.state.hoverSave) {
      info = !inOptionRoster ? 'Add this as an optional course' : 'Remove this optional course';
    } else if (this.state.hoverAdd) {
      info = !inRoster ? 'Add this course to your timetable' :
        'Remove this course from your timetable';
    }
    const integrationLogoImageUrl = {
      backgroundImage: 'url(/static/img/integrations/pilotLogo.png)',
    };
    const integrationLogo = course.integrations.indexOf('Pilot') > -1 ?
      (<div className="label integration">
        <span className="has-pilot" style={integrationLogoImageUrl} />
      </div>) : null;
    const pilotIntegration = this.props.studentIntegrations.indexOf('Pilot') > -1 ?
      (<div className="label integration">
        <a
          onMouseDown={(event) => {
            event.stopPropagation();
            this.props.showIntegrationModal(1, course.id);
          }}
        >Add as Pilot
        </a>
      </div>) : null;
    const waitlistOnlyFlag = this.props.hasOnlyWaitlistedSections ?
      <h4 className="label flag">Waitlist Only</h4> : null;
    return (
      <li
        key={course.id}
        className={classNames('search-course', {
          hovered: this.props.isHovered(this.props.position),
        })}
        onMouseDown={() => this.props.fetchCourseInfo(course.id)}
        onMouseOver={() => this.props.hoverSearchResult(this.props.position)}
      >
        <h3>{course.name || course.code} </h3>
        { addOptionalCourseButton}
        { addRemoveButton }
        <div className="search-result-labels">
          <h4
            className={classNames('label', {
              hoverAdd: this.state.hoverAdd,
              hoverSave: this.state.hoverSave,
            })}
          >
            {info}
          </h4>
          <h4
            className={classNames('label', 'bubble')}
          >{this.props.campuses[course.campus]}</h4>
          { integrationLogo }
          { pilotIntegration }
          { waitlistOnlyFlag }
        </div>
      </li>);
  }
}

SearchResult.propTypes = {
  course: SemesterlyPropTypes.course.isRequired,
  inRoster: PropTypes.bool.isRequired,
  inOptionRoster: PropTypes.bool.isRequired,
  position: PropTypes.number.isRequired,
  hoverSearchResult: PropTypes.func.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  showIntegrationModal: PropTypes.func.isRequired,
  campuses: PropTypes.shape({
    '*': PropTypes.string,
  }).isRequired,
  addCourse: PropTypes.func.isRequired,
  isHovered: PropTypes.func.isRequired,
  addRemoveOptionalCourse: PropTypes.func.isRequired,
  studentIntegrations: PropTypes.arrayOf(SemesterlyPropTypes.integration).isRequired,
  hasOnlyWaitlistedSections: PropTypes.bool.isRequired,
};

export default SearchResult;

