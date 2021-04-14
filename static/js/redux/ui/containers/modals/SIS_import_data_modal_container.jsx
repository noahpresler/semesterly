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
import SISImportDataModal from '../../modals/SIS_import_data_modal';
import { toggleSISImportDataModal, triggerSISImportDataModal } from '../../../actions/modal_actions';

const mapStateToProps = state => ({
  isVisible: state.SISImportDataModal.isVisible,
});

const SISImportDataModalContainer = connect(
  mapStateToProps,
  {
    toggleSISImportDataModal,
    triggerSISImportDataModal,
  },
)(SISImportDataModal);

export default SISImportDataModalContainer;
