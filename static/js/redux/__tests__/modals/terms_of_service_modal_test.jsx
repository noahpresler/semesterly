import React from 'react';
import renderer from 'react-test-renderer';
import TermsOfServiceModal from '../../ui/terms_of_service_modal';
import { unacceptedFixture } from '../../__fixtures__/terms_of_service_modal.fixture';

it('TOS renders as expected if time_accepted is blank', () => {
  const tree = renderer.create(
    <TermsOfServiceModal {...unacceptedFixture} />,
  ).toJSON();
  delete tree.children[0].children[0].props.style.animationName;
  delete tree.children[1].props.style.animationName;
  expect(tree).toMatchSnapshot();
});
