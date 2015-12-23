"use strict";

var SideMenu = React.createClass({
  displayName: "SideMenu",

  getInitialState: function getInitialState() {
    return {
      school: this.props.school,
      campuses: [1, 3, 5], // preference state variables
      num_campuses: 3,
      grouped: false,
      do_ranking: false,
      with_conflicts: this.props.initial_conflict,
      change_search: false, // variables which tell us whether to refresh search, timetable, or both
      change_timetable: true
    };
  },

  render: function render() {
    var copy_url_button = this.props.num_tts > 0 ? React.createElement("i", { id: "copy_tt_url",
      tabIndex: "0",
      className: "copy-url-button fa fa-3x fa-share-alt-square",
      "data-clipboard-target": "url_to_copy",
      role: "button",
      "data-container": "body",
      "data-toggle": "popover",
      "data-trigger": "focus",
      "data-placement": "auto left",
      title: "URL copied!",
      "data-content": "The URL for this timetable was copied to your clipboard. Share away!" }) : null;
    if (copy_url_button) {
      // add id to popover to change for mobile sized screens
      if ($('#copy_tt_url').data('bs.popover')) {
        $('#copy_tt_url').data('bs.popover').tip().addClass('url-share-popover');
      }
    }
    var school_logo = this.props.school == "uoft" ? React.createElement("img", { className: "pure-drawer-school-logo", src: "/static/img/school_logos/uoft_logo_white.png" }) : React.createElement("img", { className: "pure-drawer-school-logo", src: "/static/img/school_logos/jhu_logo_white.png" });

    if (this.refs.mornings) {
      var mornings_chosen = this.refs.mornings.refs.checkbox.checked;
      var evenings_chosen = this.refs.evenings.refs.checkbox.checked;
      var long_weekends_chosen = this.refs.weekends.refs.checkbox.checked;
      var conflicts_chosen = this.refs.conflicts.refs.checkbox.checked;
    } else {
      var mornings_chosen = false,
          evenings_chosen = false,
          long_weekends_chosen = false,
          conflicts_chosen = false;
    }

    return React.createElement(
      "div",
      { className: "side-menu-container", "data-effect": "pure-effect-scaleDown" },
      React.createElement(
        "div",
        { "data-position": "top" },
        React.createElement(
          "div",
          { className: "preferences-container" },
          React.createElement(
            "div",
            { className: "preferences-row", id: "top-row" },
            React.createElement(MenuOption, {
              ref: "mornings",
              icon: "hotel", text: "Mornings Free",
              method: this.handleMorningChange,
              chosen: mornings_chosen,
              loading: this.props.loading }),
            React.createElement(MenuOption, {
              ref: "evenings",
              icon: "moon-o", text: "Evenings Free",
              method: this.handleEveningChange,
              chosen: evenings_chosen,
              loading: this.props.loading })
          ),
          React.createElement(
            "div",
            { className: "preferences-row", id: "bottom-row" },
            React.createElement(MenuOption, {
              ref: "weekends",
              icon: "glass", text: "Long Weekends",
              method: this.handleLongWeekendChange,
              chosen: long_weekends_chosen,
              loading: this.props.loading }),
            React.createElement(MenuOption, {
              ref: "conflicts",
              icon: "exclamation", text: "Allow Conflicts",
              method: this.handleConflictChange,
              chosen: conflicts_chosen,
              loading: this.props.loading })
          )
        ),
        React.createElement(
          "div",
          null,
          this.props.copy_url,
          copy_url_button
        ),
        React.createElement(
          "div",
          null,
          React.createElement("div", { className: "fb-like",
            "data-href": "https://www.facebook.com/semesterly/",
            "data-layout": "button_count",
            "data-action": "like",
            "data-show-faces": "true", "data-share": "true" })
        )
      ),
      React.createElement("label", { className: "pure-overlay", htmlFor: "pure-toggle-top", "data-overlay": "top" })
    );
  },

  updateParentSettings: function updateParentSettings() {
    if (this.props.loading) {
      return;
    }
    var mornings_chosen = this.refs.mornings.refs.checkbox.checked;
    var evenings_chosen = this.refs.evenings.refs.checkbox.checked;
    var long_weekends = this.refs.weekends.refs.checkbox.checked;
    var with_conflicts = this.refs.conflicts.refs.checkbox.checked;

    var refresh_search = this.state.change_search;
    var refresh_tt = this.state.change_timetable;

    this.props.refreshPage(this.state.campuses, mornings_chosen, evenings_chosen, this.state.grouped, this.state.do_ranking, long_weekends, with_conflicts, this.state.change_timetable, this.state.change_search);
  },

  handleMorningChange: function handleMorningChange(new_value) {
    this.setState({ morning_chosen: new_value, change_timetable: true });
    this.updateParentSettings();
  },

  handleEveningChange: function handleEveningChange(new_value) {
    this.setState({ evening_chosen: new_value, change_timetable: true });
    this.updateParentSettings();
  },

  handleLongWeekendChange: function handleLongWeekendChange(new_value) {
    this.setState({ long_weekend: new_value, change_timetable: true });
    this.updateParentSettings();
  },

  handleConflictChange: function handleConflictChange(new_value) {
    this.setState({ with_conflicts: new_value, change_timetable: true });
    this.updateParentSettings();
  },
  setWithConflicts: function setWithConflicts() {
    this.refs.conflicts.refs.checkbox.checked = true;
    this.setState({ with_conflicts: true, change_timetable: true });
  }

});