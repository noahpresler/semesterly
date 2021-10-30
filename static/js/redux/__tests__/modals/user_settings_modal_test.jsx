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
import thunk from 'redux-thunk';
import Provider from 'react-redux/src/components/Provider';
import configureMockStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import UserSettingsModalContainer from '../../ui/containers/modals/user_settings_modal_container';
import { unfilledFixture, filledFixture, googleFixture } from '../../__fixtures__/user_settings_modal.fixture';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('User Setting Modal Renders As Expected', () => {
  it('VISIBLE if settings unfilled', () => {
    const store = mockStore({
      userInfo: unfilledFixture.userInfo,
      notificationToken: {
        hasToken: false,
      },
      ui: {
        highlightNotifs: false,
      },
    });
    const { container } = render(
      <Provider store={store}><UserSettingsModalContainer /></Provider>,
    );
    expect(container).toMatchSnapshot();
  });

  it('HIDDEN if settings filled', () => {
    const store = mockStore({
      userInfo: filledFixture.userInfo,
      notificationToken: {
        hasToken: false,
      },
      ui: {
        highlightNotifs: false,
      },
    });
    const { container } = render(
      <Provider store={store}><UserSettingsModalContainer /></Provider>,
    );
    expect(container).toMatchSnapshot();
  });

  it('VISIBLE if settings filled but showOverrided', () => {
    const userInfo = filledFixture.userInfo;
    userInfo.overrideShow = true;
    const store = mockStore({
      userInfo,
      notificationToken: {
        hasToken: false,
      },
      ui: {
        highlightNotifs: false,
      },
    });
    const { container } = render(
      <Provider store={store}><UserSettingsModalContainer /></Provider>,
    );
    expect(container).toMatchSnapshot();
  });

  it('VISIBLE but reduced if signing up with Google only', () => {
    const store = mockStore({
      userInfo: googleFixture.userInfo,
      notificationToken: {
        hasToken: false,
      },
      ui: {
        highlightNotifs: false,
      },
    });
    const { container } = render(
      <Provider store={store}><UserSettingsModalContainer /></Provider>,
    );
    expect(container).toMatchSnapshot();
  });
});
