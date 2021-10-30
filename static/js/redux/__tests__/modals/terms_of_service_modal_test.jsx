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
import {
  tosModalFixture,
  userInfoFixture,
} from '../../__fixtures__/terms_of_service_modal.fixture';
import { handleAgreement } from '../../actions/user_actions';
import * as ActionTypes from '../../constants/actionTypes';
import TermsOfServiceModalContainer from '../../ui/containers/terms_of_service_modal_container';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('TOS Modal', () => {
  it('shows when isVisible is true', () => {
    const store = mockStore({
      termsOfServiceModal: tosModalFixture,
      userInfo: userInfoFixture,
    });

    const { container } = render(
      <Provider store={store}>
        <TermsOfServiceModalContainer />
      </Provider>,
    );
    expect(container).toMatchSnapshot();
  });

  it('shows welcome message for new users', () => {
    const newUser = userInfoFixture;
    newUser.data.timeAcceptedTos = null;
    const store = mockStore({
      termsOfServiceModal: tosModalFixture,
      userInfo: userInfoFixture,
    });
    const { container } = render(
      <Provider store={store}>
        <TermsOfServiceModalContainer />
      </Provider>,
    );
    expect(container).toMatchSnapshot();
  });

  it('is hidden when isVisible is false', () => {
    const store = mockStore({
      termsOfServiceModal: { ...tosModalFixture, isVisible: false },
      userInfo: userInfoFixture,
    });
    const { container } = render(
      <Provider store={store}>
        <TermsOfServiceModalContainer />
      </Provider>,
    );
    expect(container).toMatchSnapshot();
  });
});

describe('HandleAgreement correctly triggers tosMODAL', () => {
  it('if unaccepted', () => {
    const store = mockStore({
      termsOfServiceModal: tosModalFixture,
      userInfo: userInfoFixture,
    });

    const currentUser = {
      timeAcceptedTos: null,
      isLoggedIn: true,
    };

    store.dispatch(handleAgreement(currentUser, Date.now()));
    const expectedActions = store.getActions();
    expect(expectedActions[0]).toEqual({ type: ActionTypes.TRIGGER_TOS_MODAL });
  });

  it('if accepted but outdated', () => {
    const store = mockStore({
      termsOfServiceModal: tosModalFixture,
      userInfo: userInfoFixture,
    });

    const currentUser = {
      timeAcceptedTos: 0,
      isLoggedIn: true,
    };

    store.dispatch(handleAgreement(currentUser, Date.parse(1)));
    const expectedActions = store.getActions();
    expect(expectedActions[0]).toEqual({ type: ActionTypes.TRIGGER_TOS_MODAL });
  });

  it('empty if logged in and accepted', () => {
    const store = mockStore({
      termsOfServiceModal: tosModalFixture,
      userInfo: userInfoFixture,
    });

    const currentUser = {
      timeAcceptedTos: 2,
      isLoggedIn: true,
    };

    store.dispatch(handleAgreement(currentUser, Date.parse(1)));
    const expectedActions = store.getActions();
    expect(expectedActions).toEqual([]);
  });
});
