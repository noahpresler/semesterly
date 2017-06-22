import PropTypes from 'prop-types';
import React from 'react';
import Modal from 'boron/DropModal';
import classNames from 'classnames';
import CourseModalBody from './course_modal_body';
import { ShareLink } from '../master_slot';
import {
  Filter, SelectedFilter, SelectedFilterSection,
} from '../advanced_search_filters';
import * as SemesterlyPropTypes from '../../constants/semesterlyPropTypes';
import { VERBOSE_DAYS } from '../../constants/constants';
import TimeSelector from '../time_selector';

class ExplorationModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show_areas: false,
      show_departments: false,
      show_levels: false,
      show_times: false,
      areas: [],
      departments: [],
      levels: [],
      times: [], // will contain 5 objects, containing keys "min" and "max" (times), for each day
      addedDays: [],
      shareLinkShown: false,
      hasUpdatedCourses: false,
    };
    this.toggle = this.toggle.bind(this);
    this.fetchAdvancedSearchResults = this.fetchAdvancedSearchResults.bind(this);
    this.fetchAdvancedSearchResultsWrapper = this.fetchAdvancedSearchResultsWrapper.bind(this);
    this.addOrRemoveCourse = this.addOrRemoveCourse.bind(this);
    this.changeTimer = false;
    this.hide = this.hide.bind(this);
    this.addFilter = this.addFilter.bind(this);
    this.isFiltered = this.isFiltered.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
    this.hideAll = this.hideAll.bind(this);
    this.showShareLink = this.showShareLink.bind(this);
    this.hideShareLink = this.hideShareLink.bind(this);
    this.handleTimesChange = this.handleTimesChange.bind(this);
    this.removeTimeFilter = this.removeTimeFilter.bind(this);
    this.addDayForTimesFilter = this.addDayForTimesFilter.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isVisible && !nextProps.isVisible) {
      this.modal.hide();
    }
    if (nextProps.advancedSearchResults !== this.props.advancedSearchResults) {
      this.setState({ hasUpdatedCourses: true });
    }
    if (nextProps.advancedSearchResults.length > 0 && this.props.advancedSearchResults === 0) {
      this.props.fetchCourseClassmates(nextProps.advancedSearchResults[0].id);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.isVisible) {
      this.modal.show();
    }
    const { areas, departments, times, levels } = this.state;
    const filters = { areas, departments, times, levels };
    const prevFilters = {
      areas: prevState.areas,
      departments: prevState.departments,
      times: prevState.times,
      levels: prevState.levels,
    };
    if (!_.isEqual(filters, prevFilters) && this.props.page > 1) {
      this.props.clearPagination();
    }
    $('.exp-search-results').scroll(() => {
      const expSearchResultsDiv = $('.exp-search-results');
      const scrollPercent = (100 * expSearchResultsDiv.scrollTop()) / (($(document).height())
        - expSearchResultsDiv.height());
      if (scrollPercent > 40 && !prevState.hasUpdatedCourses && this.state.hasUpdatedCourses) {
        this.setState({ hasUpdatedCourses: false });
        this.props.paginate();
        this.fetchAdvancedSearchResultsWrapper();
      }
    });
  }

  showShareLink() {
    this.setState({ shareLinkShown: true });
  }

  hideShareLink() {
    this.setState({ shareLinkShown: false });
  }

  toggle(filterType) {
    return () => {
      if (this.props.isFetching) {
        return;
      }
      const stateName = `show_${filterType}`;
      this.setState({ [stateName]: !this.state[stateName] });
    };
  }

  hide() {
    this.props.unHoverSection();
    this.props.hideExplorationModal();
    this.modal.hide();
  }

  fetchAdvancedSearchResults(filters) {
    if (this.props.isFetching) {
      return;
    }
    const query = this.input.value;
    const { areas, departments, times, levels } = filters;
    this.props.fetchAdvancedSearchResults(query, {
      areas,
      departments,
      times,
      levels,
    });
  }

  fetchAdvancedSearchResultsWrapper() {
    if (this.changeTimer) clearTimeout(this.changeTimer);
    this.changeTimer = setTimeout(() => {
            // fetchAdvancedSearchResults requires that its argument contain
            // at least the filters. since this.state has them, we simply pass this.state
            // as its argument. there are other aspects of state that are irrelevant for the call,
            // but we include them for the brevity of just passing this.state
      this.fetchAdvancedSearchResults(this.state);
      this.changeTimer = false;
    }, 200);
  }

  isFiltered(filterType, filter) {
    return this.state[filterType].indexOf(filter) > -1;
  }

  addFilter(filterType, filter) {
    if (this.props.isFetching || this.state[filterType].indexOf(filter) > -1) {
      return;
    }
    const updatedFilter = [...this.state[filterType], filter];
    this.fetchAdvancedSearchResults(Object.assign({}, this.state, { [filterType]: updatedFilter }));

    this.setState({ [filterType]: updatedFilter });
  }

  removeFilter(filterType, filter) {
    if (this.props.isFetching) {
      return;
    }
    const updatedFilter = this.state[filterType].filter(f => f !== filter);
    this.fetchAdvancedSearchResults(Object.assign({}, this.state, { [filterType]: updatedFilter }));
    this.setState({ [filterType]: updatedFilter });
  }

  hideAll() {
    this.setState({
      show_departments: false,
      show_areas: false,
      show_times: false,
      show_levels: false,
    });
  }

  addOrRemoveCourse(id, section = '') {
    this.props.addOrRemoveCourse(id, section);
    this.hide();
  }

  addOrRemoveOptionalCourse(course) {
    this.props.addOrRemoveOptionalCourse(course);
    this.hide();
  }


  handleTimesChange(values, component) {
    if (this.props.isFetching) {
      return;
    }
    const times = [...this.state.times];
    const i = times.findIndex(t => t.day === component);
    times[i] = Object.assign({}, times[i], values);
    this.setState({
      times,
    });
  }

  addDayForTimesFilter(filterType, day) {
    if (this.state.addedDays.indexOf(day) > -1) {
      return;
    }
    const availableDays = VERBOSE_DAYS;
    const addedDays = [...this.state.addedDays, day];
    addedDays.sort((a, b) => (
            availableDays.indexOf(a) - availableDays.indexOf(b)
        ));
    const times = [...this.state.times, {
      min: 8,
      max: 24,
      day,
    }];
    const stateUpdate = {
      addedDays,
      times,
    };
    this.setState(stateUpdate);
    this.fetchAdvancedSearchResults(Object.assign({}, this.state, stateUpdate));
  }

  removeTimeFilter(day) {
    const { times, addedDays } = this.state;
    const addedDayIndex = addedDays.indexOf(day);
    const timesIndex = times.findIndex(t => t.day === day);
    if (addedDayIndex === -1) {
      return;
    }
    const stateUpdate = {
      addedDays: [
        ...addedDays.slice(0, addedDayIndex),
        ...addedDays.slice(addedDayIndex + 1),
      ],
      times: [
        ...times.slice(0, timesIndex),
        ...times.slice(timesIndex + 1),
      ],
    };
    this.setState(stateUpdate);
    this.fetchAdvancedSearchResults(Object.assign({}, this.state, stateUpdate));
  }

  render() {
    const modalStyle = {
      width: '100%',
      backgroundColor: 'transparent',
    };
    const { advancedSearchResults, course, inRoster } = this.props;

    const numSearchResults = advancedSearchResults.length > 0 ?
      <p>returned { advancedSearchResults.length } Search Results</p> : null;
    const searchResults = advancedSearchResults.map((c, i) => (<ExplorationSearchResult
      key={c.id} code={c.code} name={c.name}
      onClick={() => this.props.setAdvancedSearchResultIndex(i, c.id)}
    />));
    let courseModal = null;
    if (course) {
      let lectureSections = {};
      let tutorialSections = {};
      let practicalSections = {};
      if (course.sections) {
        lectureSections = course.sections.L;
        tutorialSections = course.sections.T;
        practicalSections = course.sections.P;
      }
      const shareLink = this.state.shareLinkShown ?
                (<ShareLink
                  link={this.props.getShareLink(course.code)}
                  onClickOut={this.hideShareLink}
                />) :
                null;
      courseModal = (<div className="modal-content">
        <div className="modal-header">
          <h1>{ course.name }</h1>
          <h2>{ course.code }</h2>
          <div className="modal-share" onClick={this.showShareLink}>
            <i className="fa fa-share-alt" />
          </div>
          { shareLink }
          {
                        inRoster ? null :
                        <div
                          className="modal-save"
                          onClick={() => this.addOrRemoveOptionalCourse(course)}
                        >
                          <i className="fa fa-bookmark" />
                        </div>
                    }
          <div className="modal-add" onClick={() => this.addOrRemoveCourse(course.id)}>
            <i
              className={classNames('fa', {
                'fa-plus': !inRoster,
                'fa-check': inRoster,
              })}
            />
          </div>
        </div>
        <CourseModalBody
          {...course}
          lectureSections={lectureSections}
          tutorialSections={tutorialSections}
          practicalSections={practicalSections}
          data={course}
          classmates={this.props.classmates}
          addOrRemoveCourse={this.addOrRemoveCourse}
          isSectionLocked={this.props.isSectionLocked}
          isSectionOnActiveTimetable={this.props.isSectionOnActiveTimetable}
          schoolSpecificInfo={this.props.schoolSpecificInfo}
          hoverSection={this.props.hoverSection}
          unHoverSection={this.props.unHoverSection}
          react={this.props.react}
          openSignUpModal={this.props.openSignUpModal}
          hideModal={this.props.hideExplorationModal}
          changeUserInfo={this.props.changeUserInfo}
          saveSettings={this.props.saveSettings}
          isFetching={false}
          isFetchingClassmates={this.props.isFetchingClassmates}
          fetchCourseInfo={this.props.fetchCourseInfo}
          userInfo={this.props.userInfo}
          getShareLink={this.props.getShareLink}
          getShareLinkFromModal={this.props.getShareLink}
        />
      </div>);
    }
    const filterTypes = ['departments', 'areas', 'levels'];
    const filters = filterTypes.map(filterType => (
            this.props[filterType].length === 0 ? null :
            <Filter
              results={this.props[filterType]}
              key={filterType} filterType={filterType}
              add={this.addFilter} show={this.state[`show_${filterType}`]}
              isFiltered={this.isFiltered}
              onClickOut={this.hideAll}
              schoolSpecificInfo={this.props.schoolSpecificInfo}
            />
        ));
    const selectedFilterSections = filterTypes.map((filterType) => {
      if (this.props[filterType].length === 0) {
        return null;
      }
      const availableFilters = this.props[filterType];
            // sort selected filters according to the order in which they were received from props
      const sortedFilters = this.state[filterType].concat().sort((a, b) => (
                availableFilters.indexOf(a) - availableFilters.indexOf(b)
            ));
      const selectedItems = sortedFilters.map(name => (
        <SelectedFilter
          key={name} name={name}
          remove={() => this.removeFilter(filterType, name)}
        />
            ));
      const name = this.props.schoolSpecificInfo[`${filterType}Name`];

      return (
        <SelectedFilterSection
          key={filterType} name={name}
          toggle={this.toggle(filterType)}
        >

          {selectedItems}

        </SelectedFilterSection>
      );
    });

    const timeFilters = this.state.addedDays.map((d) => {
      const timeState = this.state.times.find(t => t.day === d);
      const value = { min: timeState.min, max: timeState.max };
      return (<TimeSelector
        key={timeState.day}
        day={timeState.day}
        value={value}
        onChange={(x, y = timeState.day) => this.handleTimesChange(x, y)}
        onChangeComplete={() => this.fetchAdvancedSearchResults(this.state)}
        remove={this.removeTimeFilter}
      />);
    });
    const explorationLoader = this.props.isFetching ?
      <i className="fa fa-spin fa-refresh" /> : null;
    const content = (
      <div className="exploration-content">
        <div
          className="exploration-header cf"
        >
          <div
            className="col-4-16 exp-title"
          >
            <i className="fa fa-compass" />
            <h1>Advanced Search</h1>
          </div>
          <div className="col-5-16">
            <input
              ref={(c) => { this.input = c; }}
              placeholder={`Searching ${this.props.semesterName}`}
              onInput={() => {
                this.props.clearPagination();
                this.fetchAdvancedSearchResultsWrapper();
              }
                            }
            />
          </div>
          <div
            className="exploration-close"
            onMouseDown={() => this.modal.hide()}
          >
            <i className="fa fa-times" />
          </div>
        </div>
        <div className="exploration-body">
          <div className="col-4-16 exp-filters">
            { selectedFilterSections }
            <SelectedFilterSection
              key={'times'} name={'Day/Times'}
              toggle={this.toggle('times')}
            >
              {timeFilters}

            </SelectedFilterSection>
          </div>
          <div className="col-5-16 exp-search-results">
            <div id="exp-search-list">
              { numSearchResults }
              { searchResults }
              {explorationLoader}
            </div>
          </div>
          { filters }
          <Filter
            results={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']}
            filterType={'times'}
            add={this.addDayForTimesFilter} show={this.state.show_times}
            isFiltered={this.isFiltered}
            onClickOut={this.hideAll}
            schoolSpecificInfo={this.props.schoolSpecificInfo}
          />
          {
                        this.props.isFetching && this.props.page === 1 ? null :
                        <div className="col-7-16 exp-modal">
                          { courseModal }
                        </div>
                    }
        </div>
      </div>
        );
    return (
      <Modal
        ref={(c) => { this.modal = c; }}
        className={classNames('exploration-modal max-modal', { trans: this.props.hasHoveredResult })}
        modalStyle={modalStyle}
        onHide={this.props.hideExplorationModal}
      >
        {content}
      </Modal>
    );
  }
}

const ExplorationSearchResult = ({ name, code, onClick }) => (
  <div className="exp-s-result" onClick={onClick}>
    <h4>{ name }</h4>
    <h5>{ code }</h5>
  </div>
);

ExplorationSearchResult.propTypes = {
  name: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

ExplorationModal.defaultProps = {
  course: null,
  classmates: null,
  inRoster: false,
};

ExplorationModal.propTypes = {
  inRoster: PropTypes.bool,
  addOrRemoveCourse: PropTypes.func.isRequired,
  addOrRemoveOptionalCourse: PropTypes.func.isRequired,
  advancedSearchResults: PropTypes.arrayOf(
    PropTypes.shape({
      areas: PropTypes.string.isRequired,
      campus: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      department: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      evals: PropTypes.arrayOf(
        PropTypes.shape({
          score: PropTypes.number.isRequired,
          summary: PropTypes.string.isRequired,
          year: PropTypes.string.isRequired,
        }),
      ).isRequired,
      exclusions: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      num_credits: PropTypes.number.isRequired,
      prerequisites: PropTypes.string.isRequired,
    }),
  ).isRequired,
  changeUserInfo: PropTypes.func.isRequired,
  classmates: SemesterlyPropTypes.classmates,
  clearPagination: PropTypes.func.isRequired,
  course: SemesterlyPropTypes.course,
  fetchAdvancedSearchResults: PropTypes.func.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  fetchCourseClassmates: PropTypes.func.isRequired,
  hasHoveredResult: PropTypes.bool.isRequired,
  paginate: PropTypes.func.isRequired,
  isVisible: PropTypes.bool.isRequired,
  isFetching: PropTypes.bool.isRequired,
  page: PropTypes.number.isRequired,
  hideExplorationModal: PropTypes.func.isRequired,
  schoolSpecificInfo: SemesterlyPropTypes.schoolSpecificInfo.isRequired,
  unHoverSection: PropTypes.func.isRequired,
  hoverSection: PropTypes.func.isRequired,
  setAdvancedSearchResultIndex: PropTypes.func.isRequired,
  isSectionLocked: PropTypes.func.isRequired,
  isSectionOnActiveTimetable: PropTypes.func.isRequired,
  react: PropTypes.func.isRequired,
  openSignUpModal: PropTypes.func.isRequired,
  saveSettings: PropTypes.func.isRequired,
  isFetchingClassmates: PropTypes.bool.isRequired,
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
  semesterName: PropTypes.string.isRequired,
  getShareLink: PropTypes.func.isRequired,
};

export default ExplorationModal;

