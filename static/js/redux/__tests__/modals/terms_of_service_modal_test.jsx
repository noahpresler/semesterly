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
import renderer from 'react-test-renderer';
import unacceptedFixture from '../../__fixtures__/terms_of_service_modal.fixture';
import TermsOfServiceModalContainer from '../../ui/containers/terms_of_service_modal_container';
import { handleAgreement } from '../../actions/user_actions';
import * as ActionTypes from '../../constants/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('TOS Modal Renders As Expected', () => {
  it('when isVisible', () => {
    const store = mockStore({
      termsOfServiceModal: {
        isVisible: true,
      },
      userInfo: unacceptedFixture.userInfo,
    });
    const tree = renderer.create(
      <Provider store={store}><TermsOfServiceModalContainer /></Provider>,
    ).toJSON();
    delete tree.children[0].children[0].props.style.animationName;
    delete tree.children[1].props.style.animationName;
    expect(tree).toMatchSnapshot();
  });

  it('when not isVisible', () => {
    const store = mockStore({
      termsOfServiceModal: {
        isVisible: false,
      },
      userInfo: unacceptedFixture.userInfo,
    });
    const tree = renderer.create(
      <Provider store={store}><TermsOfServiceModalContainer /></Provider>,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

describe('HandleAgreement correctly triggers tosMODAL', () => {
  it('if unaccepted', () => {
    const store = mockStore({
      termsOfServiceModal: {
        isVisible: true,
      },
      userInfo: unacceptedFixture.userInfo,
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
      termsOfServiceModal: {
        isVisible: true,
      },
      userInfo: unacceptedFixture.userInfo,
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
      termsOfServiceModal: {
        isVisible: true,
      },
      userInfo: unacceptedFixture.userInfo,
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
