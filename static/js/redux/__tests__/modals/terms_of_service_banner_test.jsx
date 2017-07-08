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


beforeEach(() => {
  global.localStorage = new LocalStorageMock();
});

describe('TOS Banner Renders As Expected', () => {
  it('fully if isVisible', () => {
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

  it('null if not isVisible', () => {
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
});

describe('TOS Banner is correctly triggered by handleAgreement', () => {
  it('is visible if no cookie', () => {
    const store = mockStore({
      termsOfServiceModal: {
        isVisible: true,
      },
      userInfo: unacceptedFixture.userInfo,
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
      userInfo: unacceptedFixture.userInfo,
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
      userInfo: unacceptedFixture.userInfo,
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
