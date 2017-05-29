import React from 'react';
import thunk from 'redux-thunk';
import Provider from 'react-redux/src/components/Provider';
import configureMockStore from 'redux-mock-store';
import renderer from 'react-test-renderer';
import TermsOfServiceModal from '../../ui/terms_of_service_modal';
import { unacceptedFixture } from '../../__fixtures__/terms_of_service_modal.fixture';
import TermsOfServiceModalContainer from '../../ui/containers/terms_of_service_modal_container';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

it('TOS Modal renders as expected if visible', () => {
  const tree = renderer.create(
    <TermsOfServiceModal {...unacceptedFixture} />,
  ).toJSON();
  delete tree.children[0].children[0].props.style.animationName;
  delete tree.children[1].props.style.animationName;
  expect(tree).toMatchSnapshot();
});

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
