import { connect } from 'react-redux';
import SearchSideBar from '../SearchSideBar.jsx';

const mapStateToProps = (state) => {
	let hovered = state.searchResults.items[state.ui.searchHover];
	let slots = hovered.slots;
	return {
    	hovered: hovered,
      slots: slots
	}
}

const SearchSideBarContainer = connect(
	mapStateToProps
)(SearchSideBar);

export default SearchSideBarContainer;
