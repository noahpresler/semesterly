var Loader = require('./loader');
var course_info_store = require('./stores/course_info');

module.exports = React.createClass({
	mixins: [Reflux.connect(course_info_store)],

	render: function() {
		var loader = this.state.loading ? <Loader /> : null;
		return (
			<div id="modal-content">
                {loader}
            </div>);
	},

});

