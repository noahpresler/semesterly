import React, { useState, useEffect } from "react";
import isEmpty from "lodash/isEmpty";
import Reaction from "../reaction";
import REACTION_MAP from "../../constants/reactions";
import MasterSlot from "../MasterSlot";
import COLOUR_DATA from "../../constants/colours";
import EvaluationList from "../evaluation_list";
import CourseModalSection from "../CourseModalSection";
import SlotHoverTip from "../slot_hover_tip";

import { getSectionTypeDisplayName, strPropertyCmp } from "../../util";
import {
  Classmate,
  Course,
  DenormalizedCourse,
  Section,
} from "../../constants/commonTypes";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { getSchoolSpecificInfo } from "../../constants/schools";
import { getCourseInfoId, userInfoActions } from "../../state/slices";
import {
  getActiveTimetable,
  getCurrentSemester,
  getDenormCourseById,
} from "../../state";
import { getSectionTypeToSections } from "../../state/slices/entitiesSlice";
import {
  getCourseShareLink,
  getCourseShareLinkFromModal,
} from "../../constants/endpoints";
import { timetablesActions } from "../../state/slices/timetablesSlice";
import { addOrRemoveCourse, react, saveSettings } from "../../actions";
import { signupModalActions } from "../../state/slices/signupModalSlice";

const CourseModalBody = (props: { hideModal: Function }) => {
  const mobileWidth = 767;
  const [isMobile, setIsMobile] = useState(window.innerWidth < mobileWidth);

  const course: DenormalizedCourse = useAppSelector((state) =>
    getCourseInfoId(state) ? getDenormCourseById(state, getCourseInfoId(state)) : null
  );
  const isFetchingClassmates = useAppSelector(
    (state) => state.courseInfo.isFetchingClassmates
  );
  const classmates = useAppSelector((state) => state.courseInfo.classmates);
  const sectionTypeToSections = getSectionTypeToSections(course);
  const popularityPercent = course?.popularity_percent * 100;
  const userInfo = useAppSelector((state) => state.userInfo.data);

  const courseSections = useAppSelector((state) => state.courseSections.objects);
  const isSectionLocked = (courseId: number, section: string) => {
    if (courseSections[courseId] === undefined) {
      return false;
    }
    return Object.keys(courseSections[courseId]).some(
      (type) => courseSections[courseId][type] === section
    );
  };
  const activeTimetable = useAppSelector((state) => getActiveTimetable(state));
  const isSectionOnActiveTimetable = (courseId: number, sectionId: number) =>
    activeTimetable.slots.some(
      (slot) => slot.course === courseId && slot.section === sectionId
    );
  const semester = useAppSelector((state) => getCurrentSemester(state));
  const getShareLink = (courseCode: number) => getCourseShareLink(courseCode, semester);
  const getShareLinkFromModal = (courseCode: number) =>
    getCourseShareLinkFromModal(courseCode, semester);
  const isComparingTimetables = useAppSelector(
    (state) => state.compareTimetable.isComparing
  );

  const schoolSpecificInfo = useAppSelector((state) =>
    getSchoolSpecificInfo(state.school.school)
  );

  const isFetching = useAppSelector((state) => state.courseInfo.isFetching);

  useEffect(() => {
    window.addEventListener("resize", () => {
      setIsMobile(window.innerWidth < mobileWidth);
    });
  }, []);

  const dispatch = useAppDispatch();

  const sendReact = (cid: number, title: string) => {
    if (userInfo.isLoggedIn) {
      dispatch(react(cid, title));
    } else {
      launchSignupModal();
    }
  };

  const launchSignupModal = () => {
    props.hideModal();
    dispatch(signupModalActions.showSignupModal());
  };

  const enableSocial = () => {
    const newUserSettings = {
      social_courses: true,
      social_offerings: true,
      social_all: false,
    };
    const userSettings = Object.assign({}, userInfo, newUserSettings);
    dispatch(userInfoActions.changeUserInfo(userSettings));
    dispatch(saveSettings());
  };

  const mapSectionsToSlots = (sections: Section[]) =>
    sections.sort(strPropertyCmp("meeting_section")).map((section: Section) => (
      <CourseModalSection
        key={course.id + section.meeting_section}
        secName={section.meeting_section}
        instr={section.instructors}
        enrolment={section.enrolment === -1 ? 0 : section.enrolment}
        waitlist={section.waitlist === -1 ? 0 : section.waitlist}
        size={section.size === -1 ? 0 : section.size}
        locked={isSectionLocked(course.id, section.meeting_section)}
        isOnActiveTimetable={isSectionOnActiveTimetable(course.id, section.id)}
        lockOrUnlock={() => {
          dispatch(addOrRemoveCourse(course?.id, section.meeting_section));
          props.hideModal();
        }}
        hoverSection={() =>
          dispatch(timetablesActions.hoverSection({ course, section }))
        }
        unHoverSection={() => dispatch(timetablesActions.unhoverSection())}
      />
    ));

  const fetchCourseInfo = (courseId: number) => {
    if (fetchCourseInfo) {
      fetchCourseInfo(courseId);
    }
  };

  if (isFetching || isEmpty(course)) {
    return (
      <div className="modal-body">
        <div className="cf">
          <span className="img-icon">
            <div className="loader" />
          </span>
        </div>
      </div>
    );
  }

  let shortCourseSection = <></>;
  const sectionType = Object.keys(sectionTypeToSections)[0];
  if (sectionType != null) {
    const offeringSample = sectionTypeToSections[sectionType][0].offering_set[0];
    if (offeringSample != null) {
      if (offeringSample.is_short_course) {
        shortCourseSection = (
          <div>
            <p>
              <p>
                <img alt="Short Course" src="/static/img/short_course_icon_25x25.png" />
                : This is a short term course. <br />
              </p>
              <p>
                Dates offered:&nbsp;
                <b>{offeringSample.date_start}</b>
                <span> to </span>
                <b>{offeringSample.date_end}</b>
              </p>
            </p>
          </div>
        );
      }
    }
  }

  const sectionGrid = Object.keys(sectionTypeToSections)
    .sort()
    .map((sType, i) => {
      const sectionTitle = `${getSectionTypeDisplayName(sType)} Sections`;
      const subTitle =
        i === 0 ? <small>(Hover to see the section on your timetable)</small> : null;
      return (
        <div key={sType}>
          <h3 className="modal-module-header">
            {" "}
            {sectionTitle} {subTitle}{" "}
          </h3>
          {mapSectionsToSlots(sectionTypeToSections[sType])}
        </div>
      );
    });

  const { reactions, num_credits: numCredits } = course;

  const cid = course.id;
  let totalReactions = reactions.map((r) => r.count).reduce((x, y) => x + y, 0);
  if (totalReactions === 0) {
    totalReactions = 20;
  }
  const reactionsDisplay = Object.keys(REACTION_MAP).map((title) => {
    const reaction = reactions.find((r) => r.title === title);
    if (reaction) {
      return (
        <Reaction
          key={title}
          selected={reaction.reacted}
          react={() => sendReact(cid, title)}
          emoji={title}
          count={reaction.count}
          total={totalReactions}
        />
      );
    } // noone has reacted with this emoji yet
    return (
      <Reaction
        key={title}
        react={() => sendReact(cid, title)}
        emoji={title}
        count={0}
        total={totalReactions}
      />
    );
  });
  reactionsDisplay.sort((r1, r2) => r2.props.count - r1.props.count);

  const integrationList = course.integrations;
  const evalInfo = course.evals;
  const relatedCourses = course.related_courses;
  const { prerequisites } = course;
  const maxColourIndex = COLOUR_DATA.length - 1;

  const similarCourses =
    relatedCourses.length === 0 ? null : (
      <div className="modal-module">
        <h3 className="modal-module-header">Students Also Take</h3>
        {relatedCourses.map((rc: Course, i: number) => (
          <MasterSlot
            key={rc.id}
            course={rc}
            professors={null}
            colourIndex={Math.min(i, maxColourIndex)}
            onTimetable
            hideCloseButton
            inModal
            fetchCourseInfo={() => fetchCourseInfo(rc.id)}
            getShareLink={getShareLink}
            colorData={COLOUR_DATA}
          />
        ))}
      </div>
    );
  const courseRegex = new RegExp(schoolSpecificInfo.courseRegex, "g");
  const matchedCoursesDescription = course.description.match(courseRegex);
  const description =
    course.description === ""
      ? "No description available"
      : course.description.split(courseRegex).map((t, i) => {
          if (matchedCoursesDescription === null) {
            return t;
          }
          if (
            matchedCoursesDescription.indexOf(t) !== -1 &&
            Object.keys(course.regexed_courses).indexOf(t) !== -1
          ) {
            return (
              <SlotHoverTip
                key={t}
                num={i}
                code={t}
                name={course.regexed_courses[t]}
                getShareLinkFromModal={getShareLinkFromModal}
              />
            );
          }
          return (
            <span className="textItem" key={t}>
              {t}
            </span>
          );
        });
  const matchedCoursesPrerequisites =
    prerequisites === null ? null : prerequisites.match(courseRegex);
  const newPrerequisites =
    prerequisites === "" || prerequisites === null
      ? "None"
      : prerequisites.split(courseRegex).map((t, i) => {
          if (
            matchedCoursesPrerequisites === null ||
            matchedCoursesPrerequisites.indexOf(t) === -1
          ) {
            return t;
          }
          if (
            matchedCoursesPrerequisites.indexOf(t) !== -1 &&
            Object.keys(course.regexed_courses).indexOf(t) !== -1
          ) {
            return (
              <SlotHoverTip
                key={t}
                num={i}
                code={t}
                name={course.regexed_courses[t]}
                getShareLinkFromModal={getShareLinkFromModal}
              />
            );
          }
          return (
            <span className="textItem" key={t}>
              {t}
            </span>
          );
        });
  const prerequisitesDisplay = (
    <div className="modal-module prerequisites">
      <h3 className="modal-module-header">Prerequisites</h3>
      <p>{newPrerequisites}</p>
    </div>
  );
  const posTags =
    course.pos && course.pos.length ? (
      <div className="modal-module areas">
        <h3 className="modal-module-header">Program of Study Tags</h3>
        <p key={`${cid}-pos`}>{course.pos.join(", ")}</p>
      </div>
    ) : (
      <div className="modal-module areas">
        <h3 className="modal-module-header">Program of Study Tags</h3>
        <p>None</p>
      </div>
    );
  const learningDenLogoImg = {
    backgroundImage: "url(/static/img/integrations/learningDen_books.png)",
  };
  const learningDenDisplay =
    integrationList.indexOf("LearningDen") > -1 ? (
      <li className="cf">
        <span className="integration-image" style={learningDenLogoImg} />
        <h4>Learning Den</h4>
        <a
          href="https://advising.jhu.edu/tutoring-mentoring/learning-den-tutoring-services/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More
        </a>
        <p>
          The Learning Den is a peer-to-peer, small group tutoring program that helps
          students to improve their understanding of course materials, and prepare for
          exams.
        </p>
      </li>
    ) : null;
  const academicSupportDisplay =
    integrationList.indexOf("LearningDen") > -1 ? (
      <div className="modal-module academic-support">
        <h3 className="modal-module-header">Academic Support</h3>
        {learningDenDisplay}
      </div>
    ) : null;
  let friendCircles = (
    <div className="loading">
      <span className="img-icon">
        <div className="loader" />
      </span>
      <p>loading...</p>
    </div>
  );
  let hasTakenCircles = (
    <div className="loading">
      <span className="img-icon">
        <div className="loader" />
      </span>
      <p>loading...</p>
    </div>
  );
  if (!isFetchingClassmates) {
    friendCircles =
      classmates.current.length > 0 ? (
        classmates.current.map((c: Classmate) => (
          <div className="friend" key={c.img_url}>
            <div
              className="ms-friend"
              style={{ backgroundImage: `url(${c.img_url})` }}
            />
            <p
              title={`${c.first_name} ${c.last_name}`}
            >{`${c.first_name} ${c.last_name}`}</p>
          </div>
        ))
      ) : (
        <p className="null">No Classmates Found</p>
      );

    hasTakenCircles =
      classmates.past.length > 0 ? (
        classmates.past.map((c: Classmate) => (
          <div className="friend" key={c.img_url}>
            <div
              className="ms-friend"
              style={{ backgroundImage: `url(${c.img_url})` }}
            />
            <p
              title={`${c.first_name} ${c.last_name}`}
            >{`${c.first_name} ${c.last_name}`}</p>
          </div>
        ))
      ) : (
        <p className="null">No Classmates Found</p>
      );
  }
  let friendDisplay = (
    <div className="modal-module friends">
      <h3 className="modal-module-header">Friends In This Course</h3>
      <div id="friends-wrapper">
        <div className="friends__inner">{friendCircles}</div>
      </div>
    </div>
  );
  let hasTakenDisplay = (
    <div className="modal-module friends">
      <h3 className="modal-module-header">Friends Who Have Taken This Course</h3>
      <div id="friends-wrapper">
        <div className="friends__inner">{hasTakenCircles}</div>
      </div>
    </div>
  );
  if (!userInfo.isLoggedIn || !userInfo.social_courses) {
    const conversionText = !userInfo.isLoggedIn
      ? "Create an account with Facebook and see which of your Facebook friends are taking or " +
        "have already taken this class!"
      : "Enable the friend feature to find out who which of your Facebook friends are taking or " +
        "have already taken this class!";
    const conversionLink = !userInfo.isLoggedIn ? (
      <a onClick={launchSignupModal}>
        <i className="fa fa-facebook" aria-hidden="true" />
        Link Facebook
      </a>
    ) : (
      <a onClick={enableSocial}>
        <i className="fa fa-facebook" aria-hidden="true" />
        Enable Facebook
      </a>
    );
    hasTakenDisplay = null;
    friendDisplay = (
      <div className="modal-module friends">
        <h3 className="modal-module-header">
          Friends In This Course or Who Have Taken This Course
        </h3>
        <div id="friends-wrapper">
          <div className="friends__inner">
            <div className="conversion">
              <div className="conversion-image" />
              <p>{conversionText}</p>
              {conversionLink}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const creditsSuffix = numCredits === 1 ? " credit" : " credits";
  const avgRating =
    evalInfo.reduce((sum: number, e: any) => sum + parseFloat(e.score), 0) /
    evalInfo.length;
  const showCapacityAttention = popularityPercent > 60;
  const attentioncapacityTracker = (
    <div className="capacity">
      <div className="capacity__attention">
        <div className="attention__tag">
          <div className="attention__clock-icon">
            <i className="fa fa-clock-o" />
          </div>
          <span>Waitlist Likely</span>
        </div>
        <div className="attention__text">
          <span>
            Over <span className="highlight">{`${popularityPercent.toFixed(2)}%`}</span>
            of seats added by students on Semesterly!
          </span>
        </div>
      </div>
    </div>
  );
  const capacityTracker = (
    <div className="capacity">
      <div className="capacity__tracker-text">
        <span>{`${popularityPercent.toFixed(2)}%`} of Seats Added on Semesterly</span>
      </div>
    </div>
  );

  return (
    <div className="modal-body">
      <div className="cf">
        <div className="col-3-16">
          <div className="credits">
            <h3>{numCredits}</h3>
            <h4>{creditsSuffix}</h4>
          </div>
          <div className="rating-module">
            <h4>Average Course Rating</h4>
            <div className="sub-rating-wrapper">
              <div className="star-ratings-sprite">
                <span
                  style={{ width: `${(100 * avgRating) / 5}%` }}
                  className="rating"
                />
              </div>
            </div>
          </div>
          {!showCapacityAttention && capacityTracker}
          {showCapacityAttention && isMobile && attentioncapacityTracker}
          {prerequisitesDisplay}
          {posTags}
          {academicSupportDisplay}
          {friendDisplay}
          {hasTakenDisplay}
        </div>

        <div className="col-8-16">
          {showCapacityAttention && !isMobile && attentioncapacityTracker}
          <h3 className="modal-module-header">Reactions</h3>
          <p>
            Check out your classmate&apos;s reactions – click an emoji to add your own
            opinion!
          </p>
          <div className="reactions-wrapper">
            <div className="reactions">{reactionsDisplay}</div>
          </div>
          <div>
            <h3 className="modal-module-header">Course Description</h3>
            <p>{description}</p>
            {shortCourseSection}
          </div>
          <div className="modal-module">
            <h3 className="modal-module-header">Course Evaluations</h3>
            <EvaluationList evalInfo={evalInfo} />
          </div>
        </div>
        <div id="modal-section-lists" className="col-5-16 cf">
          {!isComparingTimetables && sectionGrid}
          {similarCourses}
        </div>
      </div>
    </div>
  );
};

export default CourseModalBody;
