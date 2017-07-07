import { connect } from 'react-redux';
import { getActiveTimetableDenormCourses } from '../../../reducers/root_reducer';
import TextbookModal from '../../modals/textbook_modal';
import { toggleTextbookModal } from '../../../actions/modal_actions';

const mapStateToProps = state => ({
  isVisible: state.textbookModal.isVisible,
  courses: getActiveTimetableDenormCourses(state),
  isLoading: state.timetables.isFetching,
});


const TextbookModalContainer = connect(
    mapStateToProps,
  {
    toggleTextbookModal,
  },
)(TextbookModal);

export default TextbookModalContainer;
