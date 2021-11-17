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
import configureMockStore from 'redux-mock-store';
import { renderWithRedux } from '../../test-utils';
import { userInfoFixture } from '../../__fixtures__/terms_of_service_modal.fixture';
import { handleAgreement } from '../../actions/user_actions';
import * as ActionTypes from '../../constants/actionTypes';
import TermsOfServiceBannerContainer from '../../ui/containers/terms_of_service_banner_container';
import LocalStorageMock from '../../__test_utils__/local_storage_mock';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);


beforeEach(() => {
  global.localStorage = new LocalStorageMock();
});

describe('TOS Banner Renders As Expected', () => {
  it('fully if isVisible', () => {
    const initialState = {
      termsOfServiceBanner: {
        isVisible: true,
      },
      userInfo: userInfoFixture,
    };
    const { container } = renderWithRedux(<TermsOfServiceBannerContainer />, {
      preloadedState: initialState,
    });
    expect(container).toMatchSnapshot();
  });

  it('null if not isVisible', () => {
    const initialState = {
      termsOfServiceBanner: {
        isVisible: false,
      },
      userInfo: userInfoFixture,
    };
    const { container } = renderWithRedux(<TermsOfServiceBannerContainer />, {
      preloadedState: initialState,
    });
    expect(container).toMatchSnapshot();
  });
});

describe('TOS Banner is correctly triggered by handleAgreement', () => {
  it('is visible if no cookie', () => {
    const store = mockStore({
      termsOfServiceModal: {
        isVisible: true,
      },
      userInfo: userInfoFixture,
    });

    const currentUser = {
      isLoggedIn: false,
    };

    store.dispatch(handleAgreement(currentUser, Date.now()));
    const expectedActions = store.getActions();
    expect(expectedActions[0]).toEqual({ type: ActionTypes.TRIGGER_TOS_BANNER });
  });

  it('NOT if cookie is present and current', () => {
    const store = mockStore({
      termsOfServiceModal: {
        isVisible: true,
      },
      userInfo: userInfoFixture,
    });

    const currentUser = {
      isLoggedIn: false,
    };
    const timeAccepted = Date.now();

    global.localStorage.setItem('timeShownBanner', timeAccepted);

    store.dispatch(handleAgreement(currentUser, timeAccepted - 1));
    const expectedActions = store.getActions();
    expect(expectedActions).toEqual([]);
  });


  it('if cookie and updated TOS', () => {
    const store = mockStore({
      termsOfServiceModal: {
        isVisible: true,
      },
      userInfo: userInfoFixture,
    });

    const currentUser = {
      isLoggedIn: false,
    };
    const timeAccepted = Date.now();

    global.localStorage.setItem('timeShownBanner', timeAccepted);

    store.dispatch(handleAgreement(currentUser, timeAccepted + 1));
    const expectedActions = store.getActions();
    expect(expectedActions[0]).toEqual({ type: ActionTypes.TRIGGER_TOS_BANNER });
  });
});
