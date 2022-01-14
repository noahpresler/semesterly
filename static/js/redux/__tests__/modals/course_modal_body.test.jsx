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

import React from 'react';
import renderer from 'react-test-renderer';
import CourseModalBody from '../../ui/modals/course_modal_body';
import courseModalBodyFixture from '../../__fixtures__/course_modal_body.fixture';

it('CourseModalBody correctly renders', () => {
  const tree = renderer.create(
    <CourseModalBody {...courseModalBodyFixture} />,
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

