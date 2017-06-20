import React from 'react';
import thunk from 'redux-thunk';
import Provider from 'react-redux/src/components/Provider';
import configureMockStore from 'redux-mock-store';
import renderer from 'react-test-renderer';
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
    const tree = renderer.create(
      <Provider store={store}><UserSettingsModalContainer /></Provider>,
    ).toJSON();
    delete tree.children[0].children[0].props.style.animationName;
    delete tree.children[1].props.style.animationName;
    expect(tree).toMatchSnapshot();
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
    const tree = renderer.create(
      <Provider store={store}><UserSettingsModalContainer /></Provider>,
    ).toJSON();
    expect(tree).toMatchSnapshot();
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
    const tree = renderer.create(
      <Provider store={store}><UserSettingsModalContainer /></Provider>,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

});
