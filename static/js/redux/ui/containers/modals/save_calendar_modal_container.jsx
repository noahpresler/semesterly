import { connect } from 'react-redux';
import SaveCalendarModal from '../../modals/save_calendar_modal';
import { addTTtoGCal, createICalFromTimetable } from '../../../actions/calendar_actions';
import { toggleSaveCalendarModal } from '../../../actions/modal_actions';

const mapStateToProps = state => ({
  isVisible: state.saveCalendarModal.isVisible,
  isDownloading: state.saveCalendarModal.isDownloading,
  isUploading: state.saveCalendarModal.isUploading,
  hasDownloaded: state.saveCalendarModal.hasDownloaded,
  hasUploaded: state.saveCalendarModal.hasUploaded,
  userInfo: state.userInfo.data,
});

const SaveCalendarModalContainer = connect(
    mapStateToProps,
  {
    toggleSaveCalendarModal,
    addTTtoGCal,
    createICalFromTimetable,
  },
)(SaveCalendarModal);

export default SaveCalendarModalContainer;
