import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import { DropModal } from "boron-15";
import { useDispatch } from "react-redux";
import classNames from "classnames";
import { useAppSelector } from "../../hooks";
import {
  getCurrentSemester,
  getDenormAdvancedSearchResults,
  getHoveredSlots,
} from "../../state";
import { getSchoolSpecificInfo } from "../../constants/schools";
import { getCourseShareLinkFromModal } from "../../constants/endpoints";
import { explorationModalActions } from "../../state/slices";
import {
  addOrRemoveCourse,
  addOrRemoveOptionalCourse,
  fetchAdvancedSearchResults,
  fetchCourseClassmates,
  setAdvancedSearchResultIndex,
} from "../../actions";
import { timetablesActions } from "../../state/slices/timetablesSlice";
import { Course } from "../../constants/commonTypes";
import { VERBOSE_DAYS } from "../../constants/constants";
import { ShareLink } from "../master_slot";
import CourseModalBodyContainer from "../containers/modals/course_modal_body_container";
import {
  Filter,
  SelectedFilter,
  SelectedFilterSection,
} from "../advanced_search_filters";
import TimeSelector from "../time_selector";

type ExplorationSearchResultProps = {
  name: string;
  code: string;
  onClick: Function;
  isSelected: boolean;
};

const ExplorationSearchResult = ({
  name,
  code,
  onClick,
  isSelected,
}: ExplorationSearchResultProps) => (
  <div
    className="exp-s-result"
    onClick={() => onClick()}
    style={{ backgroundColor: isSelected ? "#eeeeee" : undefined }}
  >
    <h4>{name}</h4>
    <h5>{code}</h5>
  </div>
);

const AdvancedSearchModal = () => {
  const dispatch = useDispatch();

  // selectors
  const { isVisible, isFetching, active } = useAppSelector(
    (state) => state.explorationModal
  );
  const advancedSearchResults = useAppSelector(getDenormAdvancedSearchResults);
  const courseSections = useAppSelector((state) => state.courseSections.objects);
  const activeCourse = advancedSearchResults[active];
  const inRoster = activeCourse && courseSections[activeCourse.id] !== undefined;
  const schoolCourseFilters = useAppSelector((state) => state.school);
  const semester = useAppSelector(getCurrentSemester);
  const semesterName = `${semester.name} ${semester.year}`;
  const schoolSpecificInfo = useAppSelector((state) =>
    getSchoolSpecificInfo(state.school.school)
  );
  const hasHoveredResult = useAppSelector((state) => getHoveredSlots(state) != null);
  const getShareLink = (courseCode: string) =>
    getCourseShareLinkFromModal(courseCode, semester);

  const modal = useRef<DropModal>();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterData, setFilterData] = useState({
    areas: [],
    departments: [],
    levels: [],
    times: [], // will contain 5 objects, containing keys "min" and "max" (times), for each day
    addedDays: [],
  });

  const [filterVisibility, setFilterVisibility] = useState({
    show_areas: false,
    show_departments: false,
    show_levels: false,
    show_times: false,
  });
  const [shareLinkShown, setShareLinkShown] = useState(false);
  const [selected, setSelected] = useState(0);
  const [didSearch, setDidSearch] = useState(false);

  useEffect(() => {
    if (isVisible) {
      modal.current.show();
    }
    if (!isVisible) {
      modal.current.hide();
    }
  }, [isVisible]);

  const toggleFilter = (filterType: string) => () => {
    if (isFetching) {
      return;
    }
    const stateName = `show_${filterType}`;
    setFilterVisibility((prevState) => ({
      ...prevState,
      [stateName]: !(prevState as any)[stateName],
    }));
  };

  const cleanUp = () => {
    dispatch(timetablesActions.unhoverSection());
    dispatch(explorationModalActions.hideExplorationModal());
    modal.current.hide();
  };

  const hideAllFilters = () => {
    setFilterVisibility({
      show_departments: false,
      show_areas: false,
      show_times: false,
      show_levels: false,
    });
  };

  const fetchResults = () => {
    if (isFetching) {
      return;
    }

    setDidSearch(false);
    dispatch(
      fetchAdvancedSearchResults(searchQuery, {
        areas: filterData.areas,
        departments: filterData.departments,
        times: filterData.times,
        levels: filterData.levels,
      })
    );
    setDidSearch(true);
  };

  useEffect(() => {
    fetchResults();
  }, [filterData]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length <= 2) {
        return;
      }
      fetchResults();
    }, 500);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const isFiltered = (filterType: string, filter: string) =>
    (filterData as any)[filterType].indexOf(filter) > -1;

  const addFilter = (filterType: string, filter: string) => {
    if (isFetching || isFiltered(filterType, filter)) {
      return;
    }
    setFilterData((prevState) => ({
      ...prevState,
      [filterType]: [...(prevState as any)[filterType], filter],
    }));
  };

  const removeFilter = (filterType: string, filter: undefined | string = undefined) => {
    if (isFetching) {
      return;
    }
    const updatedFilter =
      filter === undefined
        ? []
        : (filterData as any)[filterType].filter((f: string) => f !== filter);
    setFilterData((prevState) => ({
      ...prevState,
      addedDays: [],
      [filterType]: updatedFilter,
    }));
  };

  const cAddOrRemoveCourse = (id: number, section = "") => {
    dispatch(addOrRemoveCourse(id, section));
    cleanUp();
  };

  const cAddOrRemoveOptionalCourse = (course: any) => {
    dispatch(addOrRemoveOptionalCourse(course));
    cleanUp();
  };

  const handleTimesChange = (values: any, component: string) => {
    if (isFetching) {
      return;
    }
    const times = [...filterData.times];
    const i = times.findIndex((t) => t.day === component);
    times[i] = { ...times[i], ...values };
    setFilterData((prevState) => ({
      ...prevState,
      times,
    }));
  };

  const addDayForTimesFilter = (filterType: string, day: string) => {
    if (filterData.addedDays.indexOf(day) > -1) {
      return;
    }
    const availableDays = VERBOSE_DAYS;
    const addedDays = [...filterData.addedDays, day];
    addedDays.sort((a, b) => availableDays.indexOf(a) - availableDays.indexOf(b));
    const times = [
      ...filterData.times,
      {
        min: 8,
        max: 24,
        day,
      },
    ];
    setFilterData((prevState) => ({
      ...prevState,
      addedDays,
      times,
    }));
  };

  const removeTimeFilter = (day: string) => {
    const { times, addedDays } = filterData;
    const addedDayIndex = addedDays.indexOf(day);
    const timesIndex = times.findIndex((t) => t.day === day);
    if (addedDayIndex === -1) {
      return;
    }
    const stateUpdate = {
      addedDays: [
        ...addedDays.slice(0, addedDayIndex),
        ...addedDays.slice(addedDayIndex + 1),
      ],
      times: [...times.slice(0, timesIndex), ...times.slice(timesIndex + 1)],
    };
    setFilterData((prevState) => ({
      ...prevState,
      ...stateUpdate,
    }));
  };

  // presentation logic
  const numSearchResults =
    !isFetching && advancedSearchResults.length > 0 ? (
      <p>returned {advancedSearchResults.length} Search Results</p>
    ) : null;

  const searchResults = advancedSearchResults.map((c: any, i) => (
    <ExplorationSearchResult
      key={c.id}
      code={c.code}
      name={c.name}
      isSelected={selected === i}
      onClick={() => {
        dispatch(setAdvancedSearchResultIndex(i, c.id));
        setSelected(i);
      }}
    />
  ));

  let courseModal = null;
  if (active >= 0 && active < advancedSearchResults.length) {
    const selectedCourse = advancedSearchResults[active];
    const shareLink = shareLinkShown ? (
      <ShareLink
        link={getShareLink(selectedCourse.code)}
        onClickOut={() => setShareLinkShown(false)}
      />
    ) : null;

    courseModal = (
      <div className="modal-content">
        <div className="modal-header">
          <h1>{selectedCourse.name}</h1>
          <h2>{selectedCourse.code}</h2>
          <div className="modal-share" onClick={() => setShareLinkShown(true)}>
            <i className="fa fa-share-alt" />
          </div>
          {shareLink}
          {inRoster ? null : (
            <div
              className="modal-save"
              onClick={() => cAddOrRemoveOptionalCourse(selectedCourse)}
            >
              <i className="fa fa-bookmark" />
            </div>
          )}
          <div
            className="modal-add"
            onClick={() => cAddOrRemoveCourse(selectedCourse.id)}
          >
            <i
              className={classNames("fa", {
                "fa-plus": !inRoster,
                "fa-check": inRoster,
              })}
            />
          </div>
        </div>
        <CourseModalBodyContainer
          data={selectedCourse}
          addOrRemoveCourse={cAddOrRemoveCourse}
          schoolSpecificInfo={schoolSpecificInfo}
          unHoverSection={() => dispatch(timetablesActions.unhoverSection())}
          hideModal={() => explorationModalActions.hideExplorationModal()}
          isFetching={false}
          getShareLink={getShareLink}
        />
      </div>
    );
  }

  const filterTypes = ["departments", "areas", "levels"];
  const filters = filterTypes.map(
    (filterType) =>
      (schoolCourseFilters as any)[filterType].length !== 0 && (
        <Filter
          results={(schoolCourseFilters as any)[filterType]}
          key={filterType}
          filterType={filterType}
          add={addFilter}
          show={(filterVisibility as any)[`show_${filterType}`]}
          isFiltered={isFiltered}
          isFetching={isFetching}
          onClickOut={hideAllFilters}
          schoolSpecificInfo={schoolSpecificInfo}
        />
      )
  );

  const selectedFilterSections = filterTypes.map((filterType) => {
    if ((schoolCourseFilters as any)[filterType].length === 0) {
      return null;
    }
    const availableFilters = (schoolCourseFilters as any)[filterType];
    // sort selected filters according to the order in which they were received from props
    const sortedFilters = (filterData as any)[filterType]
      .concat()
      .sort(
        (a: string, b: string) =>
          availableFilters.indexOf(a) - availableFilters.indexOf(b)
      );
    const selectedItems = sortedFilters.map((name: string) => (
      <SelectedFilter
        key={name}
        name={name}
        remove={() => removeFilter(filterType, name)}
      />
    ));
    const name = (schoolSpecificInfo as any)[`${filterType}Name`];

    return (
      <SelectedFilterSection
        key={filterType}
        name={name}
        type={filterType}
        toggle={toggleFilter(filterType)}
        removeAll={() => removeFilter(filterType)}
      >
        {selectedItems}
      </SelectedFilterSection>
    );
  });

  const timeFilters = filterData.addedDays.map((d) => {
    const timeState = filterData.times.find((t) => t.day === d);
    const value = { min: timeState.min, max: timeState.max };
    return (
      <TimeSelector
        key={timeState.day}
        day={timeState.day}
        value={value}
        onChange={(x: number, y = timeState.day) => handleTimesChange(x, y)}
        // onChangeComplete={fetchResults()}
        remove={removeTimeFilter}
      />
    );
  });

  const content = (
    <div
      className={classNames("exploration-content", {
        loading: isFetching,
      })}
    >
      <div className="exploration-header cf">
        <div className="col-4-16 exp-title">
          <i className="fa fa-compass" />
          <h1>Advanced Search</h1>
        </div>
        <div className="col-5-16">
          <input
            value={searchQuery}
            placeholder={`Searching ${semesterName}`}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
          />
        </div>
        <div className="exploration-close" onMouseDown={() => modal.current.hide()}>
          <i className="fa fa-times" />
        </div>
      </div>
      <div className="exploration-body">
        <div className="col-4-16 exp-filters">
          {selectedFilterSections}
          <SelectedFilterSection
            key={"times"}
            name={"Day/Times"}
            toggle={toggleFilter("times")}
            type={"times"}
            removeAll={() => {
              removeFilter("times");
            }}
          >
            {timeFilters}
          </SelectedFilterSection>
        </div>
        <div className="col-5-16 exp-search-results">
          <div id="exp-search-list" style={{ height: "calc(100% - 20px)" }}>
            {numSearchResults}
            {didSearch &&
              !isFetching &&
              (searchResults.length ? (
                searchResults
              ) : (
                <p>No courses have been found</p>
              ))}
            {isFetching ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <i className="fa fa-spin fa-refresh" />
              </div>
            ) : null}
          </div>
        </div>
        {filters}
        <Filter
          results={[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ]}
          filterType={"times"}
          add={addDayForTimesFilter}
          show={filterVisibility.show_times}
          isFiltered={isFiltered}
          isFetching={isFetching}
          onClickOut={hideAllFilters}
          schoolSpecificInfo={schoolSpecificInfo}
        />
        {isFetching ? null : <div className="col-7-16 exp-modal">{courseModal}</div>}
      </div>
    </div>
  );

  return (
    <DropModal
      ref={modal}
      className={classNames("exploration-modal max-modal", {
        trans: hasHoveredResult,
      })}
      modalStyle={{
        width: "100%",
        backgroundColor: "transparent",
      }}
      onHide={() => dispatch(explorationModalActions.hideExplorationModal())}
    >
      {content}
    </DropModal>
  );
};

export default AdvancedSearchModal;
