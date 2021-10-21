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
import { userInfoFixture } from '../../__fixtures__/user_acquisition_modal.fixture';
import UserAcquisitionModalContainer from '../../ui/containers/modals/user_acquisition_modal_container';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('User Aquisition Modal', () => {
  it('shows when isVisible is true', () => {
    const store = mockStore({
      userAcquisitionModal: { isVisible: true },
      userInfo: userInfoFixture,
    });

    const { container } = render(
      <Provider store={store}>
        <UserAcquisitionModalContainer />
      </Provider>,
    );
    expect(container).toMatchSnapshot();
  });

  it('is hidden when isVisible is false', () => {
    const store = mockStore({
      userAcquisitionModal: { isVisible: false },
      userInfo: userInfoFixture,
    });
    const { container } = render(
      <Provider store={store}>
        <UserAcquisitionModalContainer />
      </Provider>,
    );
    expect(container).toMatchSnapshot();
  });
});
