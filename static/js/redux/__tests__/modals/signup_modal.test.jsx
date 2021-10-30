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
import { render } from '@testing-library/react';
import thunk from 'redux-thunk';
import Provider from 'react-redux/src/components/Provider';
import configureMockStore from 'redux-mock-store';
import SignupModalContainer from '../../ui/containers/modals/signup_modal_container';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Signup Modal', () => {
  it('shows when isVisible is true', () => {
    const store = mockStore({
      signupModal: { isVisible: true },
    });

    const { container } = render(
      <Provider store={store}>
        <SignupModalContainer />
      </Provider>,
    );
    expect(container).toMatchSnapshot();
  });

  it('is hidden when isVisible is false', () => {
    const store = mockStore({
      signupModal: { isVisible: false },
    });
    const { container } = render(
      <Provider store={store}>
        <SignupModalContainer />
      </Provider>,
    );
    expect(container).toMatchSnapshot();
  });
});
