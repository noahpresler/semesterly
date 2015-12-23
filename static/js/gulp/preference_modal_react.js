'use strict';

var PreferencesModal = React.createClass({
  displayName: 'PreferencesModal',

  mixins: [BootstrapModalMixin],

  getInitialState: function getInitialState() {
    return { campuses: [1, 3, 5], // preference state variables
      num_campuses: 3,
      morning_chosen: false,
      evening_chosen: false,
      grouped: false,
      do_ranking: false,
      long_weekend: false,
      with_conflicts: this.props.initial_conflict,
      change_search: false, // variables which tell us whether to refresh search, timetable, or both
      change_timetable: false
    };
  },

  render: function render() {
    var style = { fontWeight: '300' };

    var save_button = React.createElement(
      'button',
      { type: 'button', className: 'btn pref-save', onClick: this.updateParentSettings, style: style },
      'Save'
    );

    var exit_button = React.createElement(
      'button',
      { type: 'button', className: 'btn pref-exit', onClick: this.exitModal, style: style },
      'Exit'
    );

    var conflict_checkbox = this.state.with_conflicts == true ? React.createElement(
      'div',
      { className: 'checkbox' },
      React.createElement(
        'label',
        null,
        React.createElement(
          'input',
          { type: 'checkbox', id: 'conflictCheckbox', value: '??', ref: 'lw', onChange: this.handleConflictChange, checked: true },
          ' Allow conflicts in my timetable.',
          React.createElement(
            'sup',
            null,
            '(beta)'
          ),
          ' '
        )
      )
    ) : React.createElement(
      'div',
      { className: 'checkbox' },
      React.createElement(
        'label',
        null,
        React.createElement(
          'input',
          { type: 'checkbox', id: 'conflictCheckbox', value: '??', ref: 'lw', onChange: this.handleConflictChange },
          ' Allow conflicts in my timetable.',
          React.createElement(
            'sup',
            null,
            '(beta)'
          ),
          ' '
        )
      )
    );

    var uoft_campuses = this.props.school == "uoft" ? React.createElement(
      'div',
      null,
      React.createElement(
        'label',
        { className: 'checkbox-inline' },
        React.createElement('input', { type: 'checkbox', id: 'inlineCheckbox1', value: 'option1', ref: 'utsg',
          onChange: this.handleCampusChange(1), defaultChecked: true }),
        ' UTSG'
      ),
      React.createElement(
        'label',
        { className: 'checkbox-inline' },
        React.createElement('input', { type: 'checkbox', id: 'inlineCheckbox2', value: 'option2', ref: 'utm',
          onChange: this.handleCampusChange(5), defaultChecked: true }),
        ' UTM'
      ),
      React.createElement(
        'label',
        { className: 'checkbox-inline' },
        React.createElement('input', { type: 'checkbox', id: 'inlineCheckbox3', value: 'option3', ref: 'utsc',
          onChange: this.handleCampusChange(3), defaultChecked: true }),
        ' UTSC'
      )
    ) : null;

    return React.createElement(
      'div',
      { className: 'modal fade' },
      React.createElement(
        'div',
        { className: 'modal-dialog' },
        React.createElement(
          'div',
          { className: 'modal-content' },
          React.createElement(
            'div',
            { className: 'modal-header' },
            this.renderCloseButton(),
            React.createElement(
              'strong',
              null,
              this.props.header
            )
          ),
          React.createElement(
            'div',
            { className: 'modal-body' },
            uoft_campuses,
            React.createElement(
              'div',
              { className: 'checkbox' },
              React.createElement(
                'label',
                null,
                React.createElement(
                  'input',
                  { type: 'checkbox', id: 'morningCheckbox', value: '??', ref: 'morning', onChange: this.handleMorningChange },
                  ' I want to avoid morning classes. '
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'checkbox' },
              React.createElement(
                'label',
                null,
                React.createElement(
                  'input',
                  { type: 'checkbox', id: 'eveningCheckbox', value: '??', ref: 'evening', onChange: this.handleEveningChange },
                  ' I want to avoid evening classes. '
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'checkbox' },
              React.createElement(
                'label',
                null,
                React.createElement(
                  'input',
                  { type: 'checkbox', id: 'lwCheckbox', value: '??', ref: 'lw', onChange: this.handleLongWeekendChange },
                  ' I want a long weekend (Friday or Monday off). '
                )
              )
            ),
            conflict_checkbox
          ),
          React.createElement(
            'div',
            { className: 'modal-footer' },
            save_button,
            exit_button
          )
        )
      )
    );
  },

  handleMorningChange: function handleMorningChange() {
    this.setState({ morning_chosen: !this.state.morning_chosen, change_timetable: true });
  },

  handleEveningChange: function handleEveningChange() {
    this.setState({ evening_chosen: !this.state.evening_chosen, change_timetable: true });
  },

  handleGroupedChange: function handleGroupedChange() {
    document.getElementById('spreadCheckbox').checked = false;
    if (document.getElementById('groupedCheckbox').checked == true) {
      this.setState({ grouped: true, do_ranking: true, change_timetable: true });
    } else {
      this.setState({ do_ranking: false, change_timetable: true });
    }
  },

  handleSpreadChange: function handleSpreadChange() {
    document.getElementById('groupedCheckbox').checked = false;
    if (document.getElementById('spreadCheckbox').checked == true) {
      this.setState({ grouped: false, do_ranking: true, change_timetable: true });
    } else {
      this.setState({ do_ranking: false, change_timetable: true });
    }
  },

  handleLongWeekendChange: function handleLongWeekendChange() {
    this.setState({ long_weekend: !this.state.long_weekend, change_timetable: true });
  },

  handleConflictChange: function handleConflictChange() {
    if (document.getElementById('conflictCheckbox').checked == true) {
      this.setState({ with_conflicts: true, change_timetable: true });
    } else {
      this.setState({ with_conflicts: false, change_timetable: true });
    }
  },

  updateParentSettings: function updateParentSettings() {
    var no_classes_before = this.state.morning_chosen ? 3 : 0;
    var no_classes_after = this.state.evening_chosen ? 21 : 27;
    var refresh_search = this.state.change_search;
    var refresh_tt = this.state.change_timetable;
    this.setState({ change_search: false, change_timetable: false });
    this.props.refreshPage(this.state.campuses, no_classes_before, no_classes_after, this.state.grouped, this.state.do_ranking, this.state.long_weekend, this.state.with_conflicts, refresh_tt, refresh_search);
  },

  exitModal: function exitModal() {
    this.props.handleCloseModal();
  },

  addCampus: function addCampus(c) {
    if (this.state.campuses.indexOf(c) == -1) {
      var updated_campuses = this.state.campuses;
      updated_campuses.push(c);
      this.setState({ campuses: updated_campuses, change_search: true });
    }
  },
  removeCampus: function removeCampus(c) {
    var updated_campuses = this.state.campuses;
    var del_index = updated_campuses.indexOf(c);
    if (del_index > -1) {
      updated_campuses.splice(del_index, 1);
    }

    this.setState({ campuses: updated_campuses, change_search: true });
  },
  handleCampusChange: function handleCampusChange(c) {
    var campus_count = this.state.num_campuses;
    return (function (event) {
      var checkbox = this.refs.utsg.getDOMNode();
      if (c == 3) {
        checkbox = this.refs.utsc.getDOMNode();
      } else if (c == 5) {
        checkbox = this.refs.utm.getDOMNode();
      }

      if (checkbox.checked) {
        this.setState({ num_campuses: campus_count + 1 });
        this.addCampus(c);
      } else {
        if (campus_count == 1) {
          event.preventDefault();
        } else {
          this.removeCampus(c);
          this.setState({ num_campuses: campus_count - 1 });
        }
      }
    }).bind(this);
  },
  setWithConflicts: function setWithConflicts() {
    document.getElementById('conflictCheckbox').checked = true;
    this.setState({ with_conflicts: true, change_timetable: true });
  }

});

/* 
TEMPORARILY REMOVED PREFERENCES: Grouped together, spread apart
// <div className="checkbox">
//   <label>
//     <input type="checkbox" id='groupedCheckbox' value='??' ref='grouped' onChange={this.handleGroupedChange}> I want my classes grouped together. </input>
//   </label>
// </div>
// <div className="checkbox">
//   <label>
//     <input type="checkbox" id='spreadCheckbox' value='??' ref='spread' onChange={this.handleSpreadChange}> I want my classes spread out. </input>
//   </label>
// </div>



*/