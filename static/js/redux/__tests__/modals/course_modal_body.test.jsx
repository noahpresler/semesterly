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

import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { renderWithRedux } from "../../test-utils";
import CourseModalBody from "../../ui/modals/CourseModalBody";
import courseModalBodyFixture from "../../__fixtures__/course_modal_body.fixture";

it("CourseModalBody correctly renders", () => {
  const course = courseModalBodyFixture.data;
  const initialState = {
    courseInfo: {
      isFetchingClassmates: false,
      classmates: courseModalBodyFixture.classmates,
    },
    userInfo: { data: { isLoggedIn: true, social_courses: true } },
    courseSections: { objects: {} },
    timetables: { items: [{ slots: [] }], active: 0 },
    semester: { current: 0, all: [{}] },
    compareTimetable: { isComparing: false },
    school: { school: "jhu" },
  };
  const { container } = renderWithRedux(
    <CourseModalBody course={course} hideModal={() => null} />,
    {
      preloadedState: initialState,
    }
  );

  expect(container).toHaveTextContent(
    "The use of microeconomics to analyze a variety of issues from marketing and finance to organizational structure. Consumer preferences and behavior; demand, cost analysis and estimation; allocation of inputs, pricing and firm behavior under perfect and imperfect competition; game theory and public policy, including competition policy. Business cases are used to connect theory and practice and to highlight differences and similarities between economics and accounting, marketing and finance. This course is restricted to students in the Commerce programs."
  );
  expect(container).toMatchSnapshot();
});
