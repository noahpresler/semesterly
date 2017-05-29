import React from 'react';
import thunk from 'redux-thunk';
import Provider from 'react-redux/src/components/Provider';
import configureMockStore from 'redux-mock-store';
import renderer from 'react-test-renderer';
import unacceptedFixture from '../../__fixtures__/terms_of_service_modal.fixture';
import { handleAgreement } from '../../actions/user_actions';
import * as ActionTypes from '../../constants/actionTypes';
import TermsOfServiceBannerContainer from '../../ui/containers/terms_of_service_banner_container';
import LocalStorageMock from '../../__test_utils__/local_storage_mock';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

global.localStorage = new LocalStorageMock();

it('TOS Banner Container renders if isVisible', () => {
  const store = mockStore({
    termsOfServiceBanner: {
      isVisible: true,
    },
    userInfo: unacceptedFixture.userInfo,
  });
  const tree = renderer.create(
    <Provider store={store}><TermsOfServiceBannerContainer /></Provider>,
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

it('TOS Banner Container does not render if not isVisible', () => {
  const store = mockStore({
    termsOfServiceBanner: {
      isVisible: false,
    },
    userInfo: unacceptedFixture.userInfo,
  });
  const tree = renderer.create(
    <Provider store={store}><TermsOfServiceBannerContainer /></Provider>,
  ).toJSON();
  expect(tree).toMatchSnapshot();
});

it('HandleAgreement triggers TOS Banner to visible if unaccepted', () => {
  const store = mockStore({
    termsOfServiceModal: {
      isVisible: true,
    },
    userInfo: unacceptedFixture.userInfo,
  });

  const currentUser = {
    timeAcceptedTos: null,
    isLoggedIn: false,
  };

  store.dispatch(handleAgreement(currentUser, Date.now()));
  const expectedActions = store.getActions();
  expect(expectedActions[0]).toEqual({ type: ActionTypes.TRIGGER_TOS_BANNER });
});

// TODO TEST COOKIE ETC