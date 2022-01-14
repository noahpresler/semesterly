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
import { renderWithRedux } from '../../test-utils';
import SignupModalContainer from '../../ui/containers/modals/signup_modal_container';


describe('Signup Modal', () => {
  it('shows when isVisible is true', () => {
    const initialState = {
      signupModal: { isVisible: true },
    };
    const { container } = renderWithRedux(<SignupModalContainer />, {
      preloadedState: initialState,
    });
    expect(container).toMatchSnapshot();
  });

  it('is hidden when isVisible is false', () => {
    const initialState = {
      signupModal: { isVisible: false },
    };
    const { container } = renderWithRedux(<SignupModalContainer />, {
      preloadedState: initialState,
    },
    );
    expect(container).toMatchSnapshot();
  });
});
