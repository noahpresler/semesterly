import React, { useState, useEffect } from "react";
import classNames from "classnames";
import Clipboard from "clipboard";
import { AreaBubble, WritingIntensive } from "../SearchResult";
import CourseModalBodyContainer from "../containers/modals/course_modal_body_container";
import { ShareLink } from "../MasterSlot";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { courseInfoActions, getCourseInfoId } from "../../state/slices";
import { timetablesActions } from "../../state/slices/timetablesSlice";
import { getCurrentSemester, getDenormCourseById, getHoveredSlots } from "../../state";
import {
  getCourseShareLink,
  getCourseShareLinkFromModal,
} from "../../constants/endpoints";
import { addOrRemoveCourse, addOrRemoveOptionalCourse } from "../../actions";
import Modal from "./Modal";

const CourseModal = () => {
  const [shareLinkShown, setShareLinkShown] = useState(false);
  const [addBtnIsHover, setAddBtnIsHover] = useState(false);
  const isVisible = useAppSelector((state) => state.courseInfo.id !== null);

  const course = useAppSelector((state) =>
    getCourseInfoId(state) ? getDenormCourseById(state, getCourseInfoId(state)) : null
  );
  const isFetching = useAppSelector((state) => state.courseInfo.isFetching);
  const isFetchingClassmates = useAppSelector((state) => state.courseInfo.classmates);
  const hasHoveredResult = useAppSelector((state) => getHoveredSlots(state) !== null);
  const courseSections = useAppSelector((state) => state.courseSections.objects);
  const inRoster = useAppSelector(
    (state) => courseSections[state.courseInfo.id] !== undefined
  );
  const semester = useAppSelector((state) => getCurrentSemester(state));
  const getShareLink = (courseCode: string) => {
    return getCourseShareLink(courseCode, semester);
  };
  const getShareLinkFromModal = (courseCode: string) => {
    return getCourseShareLinkFromModal(courseCode, semester);
  };
  const isComparingTimetables = useAppSelector(
    (state) => state.compareTimetable.isComparing
  );

  const dispatch = useAppDispatch();
  useEffect(() => {
    if (course?.code) {
      history.replaceState({}, "Semester.ly", getShareLinkFromModal(course?.code));
    }
  }, [course, isFetching, isFetchingClassmates]);

  const hide = () => {
    history.replaceState({}, "Semester.ly", "/");
    dispatch(timetablesActions.unhoverSection());
    dispatch(courseInfoActions.setCourseId(null));
  };

  const showShareLink = () => {
    setShareLinkShown(true);
    const idEventTarget = "#clipboard-btn-modal";
    const clipboard = new Clipboard(idEventTarget);
    clipboard.on("success", () => {
      $(idEventTarget).addClass("clipboardSuccess").text("Copied!");
    });
  };

  const courseAndDept =
    course?.department && course?.department !== "" ? (
      <div>
        {course?.code}, {course?.department}{" "}
      </div>
    ) : (
      course?.code
    );
  const shareLink = shareLinkShown ? (
    <ShareLink
      link={getShareLink(course?.code)}
      type="Course"
      onClickOut={() => setShareLinkShown(false)}
    />
  ) : null;
  const addOptional = inRoster ? null : (
    <div
      className="modal-save"
      onClick={() => {
        dispatch(addOrRemoveOptionalCourse(course));
        hide();
      }}
    >
      <i className="fa fa-bookmark" />
    </div>
  );
  const add =
    course?.sections !== undefined && Object.keys(course?.sections).length > 0 ? (
      <div
        className={classNames("modal-add search-course-add", {
          "in-roster": inRoster,
        })}
        onClick={() => {
          setAddBtnIsHover(false);
          dispatch(addOrRemoveCourse(course?.id));
          hide();
        }}
        onMouseEnter={() => setAddBtnIsHover(true)}
        onMouseLeave={() => setAddBtnIsHover(false)}
      >
        <i
          className={classNames("fa", {
            "fa-plus": !inRoster,
            "fa-check": inRoster && !addBtnIsHover,
            "fa-trash-o": inRoster && addBtnIsHover,
          })}
        />
      </div>
    ) : null;
  const content = (
    <div className="modal-content">
      <div className="modal-header">
        <h1>{course?.name}</h1>
        <h2>
          <div className="subtitle">
            {courseAndDept}
            {course?.areas ? <AreaBubble areas={course?.areas} /> : null}
            {course?.writing_intensive ? (
              <WritingIntensive isWritingIntensive={course?.writing_intensive} />
            ) : null}
          </div>
        </h2>
        <div className="modal-close" onClick={hide}>
          <i className="fa fa-times" />
        </div>
        <div className="modal-share">
          <i className="fa fa-share-alt" onClick={showShareLink} />
        </div>
        {shareLink}
        {!isComparingTimetables && addOptional}
        {!isComparingTimetables && add}
      </div>
      <CourseModalBodyContainer
        inRoster={inRoster}
        data={course ? course : {}}
        addOrRemoveCourse={(courseId: any, section: string = "") => {
          dispatch(addOrRemoveCourse(courseId, section));
          hide();
        }}
        hideModal={() => dispatch(courseInfoActions.setCourseId(null))}
        isFetching={isFetching}
        unHoverSection={() => dispatch(timetablesActions.unhoverSection())}
        getShareLink={getShareLink}
        getShareLinkFromModal={getShareLinkFromModal}
      />
    </div>
  );

  const modalStyle = {
    height: "900px",
    width: "1200px",
    boxShadow: "0 0",
  };
  return (
    <Modal
      visible={isVisible}
      onClose={hide}
      className={classNames("course-modal max-modal", {
        trans: hasHoveredResult,
      })}
      customStyles={modalStyle}
      customMaskStyles={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      animation="slideDown"
    >
      {content}
    </Modal>
  );
};

export default CourseModal;
