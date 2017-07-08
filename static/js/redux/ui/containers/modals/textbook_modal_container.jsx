import { connect } from 'react-redux';
import { getActiveTT } from '../../../reducers/root_reducer';
import TextbookModal from '../../modals/textbook_modal';
import { toggleTextbookModal } from '../../../actions/modal_actions';

const mapStateToProps = state => ({
  isVisible: state.textbookModal.isVisible,
  liveTimetableCourses: getActiveTT(state).courses.filter(c => !c.fake),
  isLoading: state.timetables.isFetching,
});


const TextbookModalContainer = connect(
    mapStateToProps,
  {
    toggleTextbookModal,
  },
)(TextbookModal);

export default TextbookModalContainer;
