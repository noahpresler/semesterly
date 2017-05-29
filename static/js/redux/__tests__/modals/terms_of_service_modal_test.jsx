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

it('TOS Modal Container renders if isVisible', () => {
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

it('TOS Modal Container does not render if not isVisible', () => {
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

it('HandleAgreement sets TOSModal to visible if unaccepted', () => {
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

it('HandleAgreement sets TOSModal to visible if TOS updated', () => {
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

it('HandleAgreement takes no action if logged in and accepted', () => {
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
