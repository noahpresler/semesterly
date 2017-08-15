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

import { connect } from 'react-redux';
import TermsOfServiceModal from '../terms_of_service_modal';
import { triggerTermsOfServiceModal } from '../../actions/modal_actions';
import { acceptTOS } from '../../actions/user_actions';
import { getIsUserInfoIncomplete } from '../../reducers/root_reducer';

const mapStateToProps = state => ({
  isVisible: state.termsOfServiceModal.isVisible &&
    !(!state.userInfo.overrideShow && getIsUserInfoIncomplete(state)) &&
    !state.userInfo.isVisible,
  userInfo: state.userInfo.data,
  isUserInfoIncomplete: getIsUserInfoIncomplete(state),
});

const TermsOfServiceModalContainer = connect(
    mapStateToProps,
  {
    triggerTermsOfServiceModal,
    acceptTOS,
  },
)(TermsOfServiceModal);

export default TermsOfServiceModalContainer;
