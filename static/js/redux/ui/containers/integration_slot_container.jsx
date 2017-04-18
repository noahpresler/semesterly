import { connect } from 'react-redux';
import { IntegrationSlot } from '../integration_slot';

const mapStateToProps = state => ({
  metrics: state.preferences.sort_metrics,
});

const IntegrationSlotContainer = connect(
    mapStateToProps,
    {},
)(IntegrationSlot);

export default IntegrationSlotContainer;
