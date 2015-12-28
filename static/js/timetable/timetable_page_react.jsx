
//			   [blue,    bright red,  purple,    teal,       green,    yellow,      pink,      grey]
var colour_list = ["#449DCA", "#fb6b5b", "#8A7BDD", "#26ADA1", "#8ec165", "#f0ad4e", "#FF6699", "#6E6E6E"];
// flat UI colours:
// colour_list = ["#3498db", "#e74c3c", "#8e44ad", "#1abc9c", "#2ecc71", "#f39c12"]
// how big a slot of half an hour would be, in pixels
var half_hour_height = 21;

var slot_attributes = {};
var slot_ids = [];

// A slot of 'arbitrary' size representing one session of a course
// e.g. M1, T2-3:30
var Slot = React.createClass({
	getInitialState: function() {
		return {};
	},


	render: function() {
		var slot_top = this.props.start_index * half_hour_height;
		slot_top = String(slot_top+1) + "px";
		var c = 'pointer';
		var text_style = {};
		var cls = "top-slot";
		if(!this.props.on_tt) {
			c = 'default';
			text_style = {margin: '2px 3px 0px 5px'};
			var instructors = this.props.instructors == null || this.props.instructors == '' ? null : 
			(<div className="fc-event-title" style={text_style}><small><strong>{this.props.instructors.slice(0, 3) == 'TBA' ? 'TBA' : this.props.instructors}</strong></small></div>);
		}
		else{
			cls="tt-slot";
			var instructors = this.props.instructors == null || this.props.instructors == '' ? null : 
			(<div className="fc-event-title" style={text_style}><strong>{this.props.instructors.slice(0, 3) == 'TBA' ? 'TBA' : this.props.instructors}</strong></div>);
		}
		cls+=" day-"+this.props.day;

		var slot_key = this.props.on_tt ? ' ' + String(this.props.key) : "";

		var column_width = $(".day-col").width() * .93;
		var slot_width = column_width * 0.9;
		var margin_width = (column_width - slot_width) / 2;

		var day_to_left_map = new Array();
		if (this.props.on_tt) {
			var conflict_shift = this.props.horizontal_slot * (slot_width/this.props.num_conflicts) * 1.15;
			var layer_shift = 7.5 * this.props.layer_shift;
			var total_shift = margin_width + conflict_shift + layer_shift;

			day_to_left_map['M'] = String($(".fc-mon").position().left + total_shift + "px");
			day_to_left_map['T'] = String($(".fc-tue").position().left + total_shift +"px");
			day_to_left_map['W'] = String($(".fc-wed").position().left + total_shift +"px");
			day_to_left_map['R'] = String($(".fc-thu").position().left + total_shift +"px");
			day_to_left_map['F'] = String($(".fc-fri").position().left + total_shift +"px");
		} else {
			day_to_left_map['M'] = String($(".fc-mon").position().left + margin_width + "px");
			day_to_left_map['T'] = String($(".fc-tue").position().left + margin_width +"px");
			day_to_left_map['W'] = String($(".fc-wed").position().left + margin_width +"px");
			day_to_left_map['R'] = String($(".fc-thu").position().left + margin_width +"px");
			day_to_left_map['F'] = String($(".fc-fri").position().left + margin_width*.75 +"px");
		}

		for(var i = 1; i <= 9; i++){ // top slots
			if ($(window).width() > 1080) {
				day_to_left_map[i] = String(265+(i-1)*105 + "px");
			}
			else {
				day_to_left_map[i] = String(265+(i-1)*85 + "px");
			}
		}
		var slot_height = String(this.props.duration*(2*half_hour_height) - 9) + "px";
		var rl = {float: 'right', cursor: 'pointer'};
		var loc_style = {float: 'left', cursor: 'pointer'};
		var slot_style={
			position: 'absolute',
			top: slot_top,
			height: slot_height,
			backgroundColor: this.props.color,
			width: this.props.width,
			cursor: c,
			border: '0px',
			left:day_to_left_map[this.props.day],
			zIndex: this.props.zInd
		};
		var location = this.props.num_conflicts == 1 ? 
			(<p style={rl} className="offering-location">{this.props.location}</p>)
			:
			null;
		var offering_time = this.props.num_conflicts == 1 || !this.props.on_tt?
			<a style={rl} className="slot-link">{this.props.time}</a>
			:
			null;

		if (this.props.on_tt) {
			var section = 
			(<div className="fc-event-title offering-section" style={text_style}>
				<strong>{" " + this.props.section}</strong>
				{location}
			</div>);
		}
		else {
		var section = this.props.locked ? 
			(<div className="fc-event-title slot-locked offering-section" style={text_style} onClick={this.props.lockOrUnlockSection}>
				<strong><i className="fa fa-lock"></i>{" " + this.props.section}</strong>
				{location}
			</div>) 
			:
			(<div className="fc-event-title slot-unlocked offering-section" style={text_style} onClick={this.props.lockOrUnlockSection}>
				<strong><i className="fa fa-unlock-alt"></i>{" " + this.props.section}</strong>
				{location}
			</div>);
		}
		if (this.props.section[0] == 'T' || this.props.section[0] == 'P') {
			section = 
			(<div className="fc-event-title offering-section" style={text_style}>
				<strong>{" " + this.props.section}</strong>
				{location}
			</div>);
		}

		
		var instructors = this.props.instructors == null || this.props.instructors == '' ? null : 
		(<div className="fc-event-title" style={text_style}><strong>{this.props.instructors.slice(0, 3) == 'TBA' || this.props.instructors.slice(0, 3) == 'T.B' ? 'TBA' : this.props.instructors}</strong></div>);

		return(
	<div className={"fc-event fc-event-vert fc-event-draggable fc-event-start fc-event-end ui-draggable ui-resizable " + cls + slot_key} style={slot_style} data-toggle="tooltip" data-placement="bottom" title={this.props.name}>
		  <div className="fc-event-inner">
		  	<div className="fc-event-title" style={text_style}><strong>{this.props.code}</strong> {offering_time}</div>
			{section}
		    {instructors}
		  </div>

		  <div className="fc-event-bg"></div>
		  <div className="ui-resizable-handle ui-resizable-s"> </div>
		</div>
		);
	}
});

var TimetablePage = React.createClass({
	getInitialState: function() {
		// Check for conflict flag in cookie/url
		var path = window.location.pathname.split("/");
		var url_data = path[2];
		var initial_conflict;
		var has_results = false;
		// first check for URL. if none, then check cookie. (sharing gets priority)
		if (url_data == null || url_data == "") { // no URL.
			if (document.cookie != "" && document.cookie != null) { // check for cookie.
				var courses = getCookie("data");
				if (courses != null) {
					var school_ = courses.split("&")[0];
				}
				else {
					var school_= "";
				}
			}
		}
		else {  // we're here from URL
			var school_ = url_data.split("&")[0];
			courses = url_data
		}

		if (school_ != "jhu" && school_ != "uoft") {school_ = ""; courses = "";}

		if (courses != "" && courses != null) {
			initial_conflict = courses.split("&")[2] == 't' ? true : false;

		} else {
			initial_conflict = false;
		}

		return {
				school: school_, 
				all_tts: [], current_tt_id: null, all_slots: [], semester: 'S',
				all_f_tts: [], all_s_tts: [], current_f_tt_id: 0, current_s_tt_id: 0,
				all_f_slots: [], all_s_slots: [],
				course_to_colour: [], f_course_to_colour: [], s_course_to_colour: [],
				used_colours: [], f_used_colours: [], s_used_colours: [],
				loading: false, conflict: false, retry: false,
				campuses: [1, 3, 5], none_before: false, none_after: false, grouped: false, do_ranking: false, 
				long_weekend: false, with_conflicts: initial_conflict,
				courses: [], f_courses: [], s_courses: [], selected_sections: {},
				search: true
			}; // search == true => search bar + search results show. false => side menu shows
	},

	hasSearchResults: function(has_results) {
		this.setState({has_results: has_results});
	},

	getTimetableSlots: function(ttable) {
		var i, slots = [];
		for (var course in ttable) {
			var crs = ttable[course];
			for (var slot in crs[2]) {
				for (var k in crs[2][slot]) {
					slots.push(crs[2][slot][k]);
				}
			}
		}
		return slots;
	},

	updateTimetable: function(ttables, tt_id) {
		if(ttables.length > 0 && tt_id > ttables.length - 1 || tt_id < 0) { tt_id=0;}
		if(this.state.semester == 'F') {
			var updated_mapping = this.state.course_to_colour;

			var updated_used_colours = this.state.used_colours;

			var ttable = ttables[tt_id];
			var i, slots = [];

			// if a course was removed, remove its associated mapping from updated_mapping
			// and indicate its colour as available

			for (var course_code in updated_mapping) {
				var in_new_tt = false;
				for (var c in ttable) {
					if (ttable[c][0].code == course_code) {
						in_new_tt = true;
					}
				}
				if (!in_new_tt) {
					var colour_index = updated_mapping[course_code];
					delete updated_mapping[course_code];
					var del_index = updated_used_colours.indexOf(colour_index);
					updated_used_colours.splice(del_index, 1);
				}
			}

			for (var course in ttable) {
				var crs = ttable[course];
				for (var slot in crs[2]) {
					for (var k in crs[2][slot]) {
						slots.push(crs[2][slot][k]);
					}
				}
				var code = crs[0].code;
				if (updated_mapping[code] == null) {
					for (i = 0; i < colour_list.length; i ++) {
						if(updated_used_colours.indexOf(i) == -1) {
							updated_mapping[code] = i; // update the prev course to colour mapping
							updated_used_colours.push(i);
							break;
						}
					}

				}
			}
			this.setState({all_f_tts: ttables, 
							all_tts: ttables,
							current_f_tt_id:tt_id,
							current_tt_id: tt_id,
							all_f_slots: slots, 
							all_slots: slots,
							course_to_colour: updated_mapping,
							f_course_to_colour: updated_mapping, 
							used_colours: updated_used_colours,
							f_used_colours: updated_used_colours,
							conflict: false});
		}
		else {

			var updated_mapping = this.state.course_to_colour;

			var updated_used_colours = this.state.used_colours;

			var ttable = ttables[tt_id];
			var i, slots = [];

			// if a course was removed, remove its associated mapping from updated_mapping
			// and indicate its colour as available

			for (var course_code in updated_mapping) {
				var in_new_tt = false;
				for (var c in ttable) {
					if (ttable[c][0].code == course_code) {
						in_new_tt = true;
					}
				}
				if (!in_new_tt) {
					var colour_index = updated_mapping[course_code];
					delete updated_mapping[course_code];
					var del_index = updated_used_colours.indexOf(colour_index);
					updated_used_colours.splice(del_index, 1);
				}
			}

			for (var course in ttable) {
				var crs = ttable[course];
				for (var slot in crs[2]) {
					for (var k in crs[2][slot]) {
						slots.push(crs[2][slot][k]);
					}
				}
				var code = crs[0].code;
				if (updated_mapping[code] == null) {
					for (i = 0; i < colour_list.length; i ++) {
						if(updated_used_colours.indexOf(i) == -1) {
							updated_mapping[code] = i; // update the prev course to colour mapping
							updated_used_colours.push(i);
							break;
						}
					}

				}
			}

			this.setState({all_s_tts: ttables, 
							all_tts: ttables,
							current_s_tt_id:tt_id,
							current_tt_id: tt_id,
							all_s_slots: slots, 
							all_slots: slots,
							course_to_colour: updated_mapping,
							s_course_to_colour: updated_mapping, 
							used_colours: updated_used_colours,
							s_used_colours: updated_used_colours,
							conflict: false});
		}
	},	

	prevTimetable: function() {
		var total = this.state.all_tts.length;
		if (total > 1 && this.state.current_tt_id > 0) {
			var all_tts = this.state.all_tts;
			var new_id = this.state.current_tt_id - 1;
			var new_tt = all_tts[new_id];
			var slots = this.getTimetableSlots(new_tt);
			if(this.state.semester == 'F') {
				this.setState({current_f_tt_id: new_id, 
								current_tt_id: new_id,
								all_f_slots: slots, 
								all_slots: slots});
			}
			else {
				this.setState({current_s_tt_id: new_id, 
							current_tt_id: new_id,
							all_s_slots: slots, 
							all_slots: slots});	
			}
		}
	},

	nextTimetable: function() {
		var total = this.state.all_tts.length;
		if (total > 1 && this.state.current_tt_id < total - 1) {
			var all_tts = this.state.all_tts;
			var new_id = this.state.current_tt_id + 1;
			var new_tt = all_tts[new_id];
			var slots = this.getTimetableSlots(new_tt);
			if(this.state.semester == 'F') {
				this.setState({current_f_tt_id: new_id, 
								current_tt_id: new_id,
								all_f_slots: slots, 
								all_slots: slots});
			}
			else {
				this.setState({current_s_tt_id: new_id, 
							current_tt_id: new_id,
							all_s_slots: slots, 
							all_slots: slots});	
			}
		}

	},

	removeTimetable: function(){
		if(this.state.semester == 'F'){
			this.setState({all_f_tts: [], all_tts: [], all_f_slots: [], all_slots: [], current_tt_id: 0, current_f_tt_id: 0, conflict: false,
							courses: [], f_courses: [], sections: {}});
		}
		else {
			this.setState({all_s_tts: [], all_tts: [], all_s_slots: [], all_slots: [], current_tt_id: 0, current_s_tt_id: 0, conflict: false,
							courses: [], s_courses: [], sections: {}});
		}
	},
	setSchool: function(updated_school) {
		this.setState({school: updated_school});
		setTimeout(this.beginTutorial, 500);
	},

	setSemester: function(sem){
		if(sem == 'F') {
			this.setF();
		}
		else{
			this.setS();
		}
	},
	setF: function() {
		this.setState({semester: 'F', all_tts: this.state.all_f_tts, current_tt_id: this.state.current_f_tt_id, all_slots: this.state.all_f_slots, course_to_colour: this.state.f_course_to_colour, used_colours: this.state.f_used_colours, conflict:false, courses: this.state.f_courses});
	},
	setS: function(){
		this.setState({semester: 'S', all_tts: this.state.all_s_tts, current_tt_id: this.state.current_s_tt_id, all_slots: this.state.all_s_slots, course_to_colour: this.state.s_course_to_colour, used_colours: this.state.s_used_colours, conflict:false, courses: this.state.s_courses});
	},
	setConflict: function() {
		this.setState({conflict: true});
	},
	setWithConflicts: function() {
		this.setState({with_conflicts: true});
		this.refs.side_menu.setWithConflicts();
	},
	tryWithConflicts: function() {
		this.setWithConflicts();
		this.refs.tta.refreshTimetable(this.state.courses)
	},
	removeConflictMsg: function() {
		this.setState({conflict: false});
	},
	setRetry: function() {
		this.setState({retry: false});
	},
	setLoading: function(){
		this.setState({loading: true});
	},
	setDone: function() {
		this.setState({loading: false});
	},

	handleShowModal: function() {
	    this.refs.preference_modal.show();
	},
	 
	handleExternalHide: function() {
	    this.refs.tta.updateResults();
	},
	 
	handleCloseModal: function() {
	    this.refs.preference_modal.hide();
	},

	handleCloseSchoolModal: function() {
		this.refs.school_modal.hide();
	},

	refreshPage: function(updated_campuses, updated_morning, updated_evening, updated_grouped, updated_ranking,
							updated_lw, updated_conflicts, refresh_tt, refresh_search) {
		this.setState({campuses: updated_campuses, 
					   none_before: updated_morning, 
					   none_after: updated_evening, 
					   grouped: updated_grouped,
					   do_ranking: updated_ranking,
					   long_weekend: updated_lw,
					   with_conflicts: updated_conflicts,
					   retry: updated_conflicts == false ? true : false});
		// this.refs.preference_modal.hide();
		if (!refresh_search && refresh_tt && this.state.courses.length > 0) {
			this.refs.tta.refreshTimetable(this.state.courses);
		} else {
			this.refs.tta.updateResults(this.state.courses, refresh_tt);
		}
	},

	updateCourses: function(chosen){
		if (this.state.semester == 'F'){
			this.setState({courses:chosen, f_courses: chosen});
		}
		else {
			this.setState({courses:chosen, s_courses: chosen});
		}
		if (this.state.tutorial) {
			setTimeout((function() {

				this.setState({tutorial: false});


				this.continueTutorial();



			}).bind(this), 200);
		}
	},
	continueTutorial: function() {
		+_.bind(function ($) {

		  $(_.bind(function(){


		    var intro = introJs();

		    intro.setOptions({
		      steps: [
		      {
		          element: '.tt-wrapper',
		          intro: '<p class="h4 text-uc"><strong>2: Schedule</strong></p><p>Great job! Your course has now been added to your roster, and you can see exactly how it fits into your schedule right here.</p>',
		          position: 'left'
		        },
		        {
		          element: '.fc-button-next',
		          intro: '<p class="h4 text-uc"><strong>3: Cycle Through Timetables</strong></p><p>Once you\'ve chosen a set of courses, there may be more schedules for you to view –– each including the same courses but at different times. Click the arrows to cycle through <b>all</b> your potential schedules for the semester!</p>',
		          position: 'left'
		        },
		        {
		          element: '.top-slot',
		          intro: '<p class="h4 text-uc"><strong>4: Roster</strong></p><p>Up here is your entire roster –– all the courses you\'ve chosen this semester. If you like a particular section, click the Lock Icon (<i class="fa fa-unlock-alt"></i>) to Lock it in place – this will ensure that all timetables you see will only include this section.</p>',
		          position: 'right'
		        },
		        {
		          element: '.fa-exchange',
		          intro: '<p class="h4 text-uc"><strong>5: Preferences and Sharing</strong></p><p>Click the double arrow icon at anytime to set preferences –– for example, you can choose to sleep in or take Fridays off! We\'ll try to satisfy as many of your preferences as possible. Lastly, click the share icon to get a custom link to your timetable that you can share with your friends!</p>',
		          position: 'right'
		        },
		       
		      ],
		      showBullets: true,
		    });
		    intro.setOptions({
		      exitOnOverlayClick: false
		    });

		    intro.start();
		    
		    

		  }, this));
		}, this)(jQuery);
	},
	updateSections: function(sections){
		this.setState({selected_sections: sections});
	},
	
	generateUrl: function() {
		var url = "";
		if(this.state.all_tts.length > 0){
			var conflict_flag = this.state.with_conflicts ? 't' : 'f'
			url = window.location.href + "/" + this.state.school + "&" + 
					this.state.semester + "&" + conflict_flag + "&" + this.state.current_tt_id;
			var courses = this.state.courses;
			var sections = this.state.selected_sections;
			for (var i = 0; i < courses.length; i++) {
				url += "&" + String(h2.encode(courses[i]));
				var hex = hexEncode(sections[courses[i]]);
				url += '+' + String(h2.encodeHex(hex));
			}
		}
		return url;
	},

	render: function() {

		var user_courses = [];
		if (this.state.all_tts.length != 0) {
			var cur_tt = this.state.all_tts[this.state.current_tt_id];
			var num_courses = cur_tt.length;
			for (var m = 0; m < num_courses; m++) {
				var course = cur_tt[m];
				// RELEVANT "IF" STATEMENT REMOVED FOR HOPKINS:
				// if (course[1].indexOf("L") > -1) {
				if ((this.state.school == "uoft" && 
					course[1].indexOf("L") > -1) || this.state.school != "uoft") {
					user_courses.push([course[0].id, course[0].code, course[1], course[2][0][0]]);
				}
			}
		}
		var c = -1; 
		var days = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		var user_courses_display = user_courses.length == 0 ? null : user_courses.map(function(uc) {			
			// these are the top slots

			c = c + 1;
			var nextColour = colour_list[c];
			var crs = new Array();
			crs['id'] = uc[0];
			var rm = !this.state.loading ? this.refs.tta.removeCourse(crs) : null;
			var close = <i onClick={rm} className="fa fa-times"></i>;
			var co_obj = uc[3];
			var colour = colour_list[this.state.course_to_colour[uc[1]]];
			var w = window.width >= 768 ? "87px" : "105px";
			var is_locked = this.state.selected_sections[co_obj.course_id] == uc[2];
			var new_section = is_locked ? "" : co_obj.section;
			var lock_unlock = !this.state.loading ? this.refs.tta.updateSection(co_obj.course_id, new_section) : null;
			return (<span>
						<Slot 
						code={uc[1]} 
						section={uc[2]} 
						locked={is_locked}
						locked_section={this.state.selected_sections[co_obj.course_id]}
						name={co_obj.name}
						course_id={co_obj.course_id}
						instructors={co_obj.instructors} 
						key={co_obj.id} 
						day={days[c]} 
						start_index={.97} 
						duration={1.5} 
						time={close} 
						color={colour} 
						width={w} 
						on_tt={false}
						lockOrUnlockSection = {lock_unlock}/>
					</span>);
		}.bind(this));


		//  var course, code, title, lecture, off;
		var x = 9;
		var all_current_slots = this.state.all_slots.slice(0);
		all_current_slots.sort(function(a, b) {
			return b.depth_level - a.depth_level;
		});

		var slot_attributes = {};
		var slot_ids = [];
		var slots = all_current_slots.map(function(s) { // these are the on-timetable slots
			var nextColour = colour_list[this.state.course_to_colour[s.code]];
			x -= 1;
			var column_width = $(".day-col").width() * 0.93;
			var padding_factor = 0.9;
			var conflict_factor = (1/s.num_conflicts) * Math.pow(.93, s.num_conflicts - 1)
			var layer_factor = s.depth_level * 7.5;
			var w = String(column_width * padding_factor * conflict_factor) - layer_factor + "px";
			var is_locked = this.state.selected_sections[s.course_id]==s.section;
			var new_section = is_locked ? "" : s.section;
			var lock_unlock = !this.state.loading ? this.refs.tta.updateSection(s.course_id, new_section) : null;

			slot_ids.push(s.id);
			slot_attributes[s.id] = {col_width: column_width, padding_factor: padding_factor, conflict_factor: conflict_factor, 
									layer_factor: layer_factor, shift_index: s.shift_index, num_conflicts: s.num_conflicts,
									depth_level: s.depth_level, day: s.day}

			return (<Slot 
				zInd={x} 
				code={s.code} 
				name={s.name} 
				course_id={s.course_id}
				section={s.section} 
				locked={is_locked}
				locked_section={this.state.selected_sections[s.course_id]}
				location={s.location} 
				duration={s.duration} 
				time={s.full_time} 
				day={s.day} 
				start_index={s.start_index} 
				color={nextColour} 
				width={w} 
				on_tt={true}
				layer_shift={s.depth_level}
				num_conflicts={s.num_conflicts}
				horizontal_slot={s.shift_index}
				lockOrUnlockSection={lock_unlock}
				key={s.id} /> );
		}.bind(this));     

		var tt_count = this.state.all_tts.length;

		var prev_button = tt_count > 1 && this.state.current_tt_id > 0 ? (
			<span onClick={this.prevTimetable} className="fc-button fc-button-prev fc-state-default fc-corner-left fc-corner-right" unselectable="on">
				<a className= "btn btn-dark btn-md switch-tt fa fa-long-arrow-left"></a>
			</span>) : <span className="fc-button fc-button-prev fc-state-default fc-corner-left fc-corner-right greyed" unselectable="on">
			  <a className= "btn btn-dark btn-md switch-tt fa fa-long-arrow-left disabled-arrow"></a>
			</span>;

		var next_button = tt_count > 1 && this.state.current_tt_id < tt_count - 1 ? (   
			<span onClick={this.nextTimetable} className="fc-button fc-button-next fc-state-default fc-corner-left fc-corner-right" unselectable="on">
			  <a className= "btn btn-dark btn-md switch-tt fa fa-long-arrow-right"></a>
			</span>) : <span className="fc-button fc-button-next fc-state-default fc-corner-left fc-corner-right greyed" unselectable="on">
			  <a className= "btn btn-dark btn-md switch-tt fa fa-long-arrow-right disabled-arrow"></a>
			</span>;

		var loader = null;
		var load_or_not_style = {};
		if (this.state.loading) {
			prev_button = null;
			next_button = null;
			loader = (<i className="fc-button fc-button-next fc-corner-left fc-corner-right fa fa-spin fa-cog tt-loader"></i>);
			load_or_not_style = {opacity: '0.6'};
		}

		var second_semester_name = this.state.school == "jhu" ? "Spring" : "Winter";

		var timetable_semester = this.state.semester == 'F' ? "Fall 2015" : second_semester_name + " 2016";

		var vbox_style = {marginTop: '89px'};

		var conflict_msg = this.state.conflict  && !this.state.with_conflicts ? 
		(<div className="alert alert-danger alert-dismissable conflict-msg">
			<span className="fa-stack fa-lg">
			  <i className="fa fa-ban fa-stack-2x calendar-ban"></i>
			</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>That course/section could not be added without a conflict!</strong> Give it a shot with conflicts turned on!
			<div>
				<button type="button" className="btn btn-danger btn-conflict" onClick={this.tryWithConflicts}>Turn conflicts on</button><button type="button" className="btn btn-danger btn-conflict" onClick={this.removeConflictMsg}>Exit</button>
	    	</div>
	    </div>) : null;

		var num_tts_string = this.state.all_tts.length > 1 ? "timetables" : "timetable";
		// var num_timetables_generated = this.state.all_tts.length > 0 ? (<span className="fc-button fc-button-next label bg-light" id="num-tts-generated">{this.state.all_tts.length} {num_tts_string} generated!</span>) : null;
		var num_timetables_generated = null;

		var copy_style = {display: 'none'};
		var url = this.generateUrl();
		var copy_url = <p id="url_to_copy" style={copy_style}>{url}</p>;
		var copy_url_button = this.state.all_tts.length > 0 ? 
		(<i id="copy_tt_url" 
			tabIndex="0" 
			className="copy-url-button fa fa-2x fa-share-alt-square"
			data-clipboard-target="url_to_copy" 
			role="button" 
			data-toggle="popover" 
			data-trigger="focus" 
			data-placement="left" 
			title="URL copied!" 
			data-content="The URL for this timetable was copied to your clipboard. Share away!"></i>) 
		: null;

		var school_picker = null;
		// var school_picker = this.state.school == "" ? 
		// (<SchoolModal ref="school_modal"
		// 			  backdrop="static"
		// 			  show={true}
		// 			  header="Pick Your School"
		// 			  setSchool={this.setSchool}
		// 			  handleCloseModal={this.handleCloseSchoolModal}
		// 			>
		// </SchoolModal>
		// ) : null;

		var drawer_menu = null;
		// var drawer_menu = <DrawerMenu 
		// 					ref="menu" 
		// 					loading={this.state.loading}
		// 					school={this.state.school}
		// 					refreshPage={this.refreshPage}
	 //    					handleCloseModal={this.handleCloseModal}
		// 					initial_conflict={this.state.with_conflicts}
		// 					num_tts={this.state.all_tts.length}
		// 					copy_url={copy_url}
		// 					> </DrawerMenu>;

			var search_bar = (<TimetableSearch 
			display={this.state.search}
			ref="tta" 
			school={this.state.school}
			updateTimetable={this.updateTimetable} 
			removeTimetable={this.removeTimetable} 
			updateCourses={this.updateCourses} 
			updateSections={this.updateSections}
			setRetry={this.setRetry}
			setWithConflicts={this.setWithConflicts}
			setF={this.setF} 
			setS={this.setS} 
			setConflict={this.setConflict}
			setLoading={this.setLoading} 
			setDone={this.setDone}
			hasSearchResults={this.hasSearchResults}
			campuses={this.state.campuses} 
			none_before={this.state.none_before} 
			none_after={this.state.none_after} 
			grouped={this.state.grouped} 
			do_ranking={this.state.do_ranking} 
			long_weekend={this.state.long_weekend} 
			with_conflicts={this.state.with_conflicts} 
			retry={this.state.retry}
			setSemester={this.setSemester}/>);

			var side_menu = (
							<SideMenu
							ref="side_menu" 
							loading={this.state.loading}
							school={this.state.school}
							refreshPage={this.refreshPage}
	    					handleCloseModal={this.handleCloseModal}
							initial_conflict={this.state.with_conflicts}
							num_tts={this.state.all_tts.length}
							copy_url={copy_url}>
							</SideMenu>);
		

		var switch_side_panel = <div id="bar-switcher">
									<i className="fa fa-exchange fa-3x" id="switch-sidebar-icon"
									onClick={this.switchSidePanel}></i>
								</div>
		var mobileClassName = this.state.has_results ? "mobile-nav-sidebar expanded" : "mobile-nav-sidebar collapsed";
		return (

			<div id="wrapper">
				 
				    <i className="fa fa-question-circle help" onClick={this.beginTutorial}/>
					<div className="collapse navbar-collapse navbar-ex1-collapse">
						<ul className="nav navbar-nav side-nav cool-nav">
							<img className="tt-logo" src="/static/img/semesterly_shield_large.png"/>
							<div className="timetable-container">
								{switch_side_panel}
								{side_menu}
								<div className={mobileClassName}>
									{search_bar}
								</div>
							</div>
						</ul>			    

				 	</div>


				<div id="page-wrapper">
					{school_picker}

					
					<div className="separation">
						{user_courses_display}
						{conflict_msg}
					</div>


				    <section className="vbox" style={vbox_style}>

				      <section>
				        <section className="hbox stretch">

				          <section id="content">
				            <section className="hbox stretch">          
				              <aside>
				         <section className="vbox">
				           <section className="scrollable wrapper tt-wrapper">
				             <section className="panel panel-default">

				               <div className="fc fc-ltr" id="calendar">
				                <table className="fc-header full-width">
				                  <tbody>
				                    <tr>
				                      <td className="fc-header-left">
				                      {prev_button}{loader}{num_timetables_generated}
				                      </td>
				                      <td className="fc-header-center">
				                        <span className="fc-header-title">
				                        <h2>{timetable_semester}</h2></span>
				                      </td>
				                      <td className="fc-header-right">
				                        {next_button}
				                      </td>
				                    </tr>
				                  </tbody>
				                </table>
				                <div className="fc-content prel">
				                  <div className="fc-view fc-view-agendaWeek fc-agenda prel" unselectable="on" style={load_or_not_style}>
				                    <table className="fc-agenda-days fc-border-separate full-width" cellSpacing="0">
				                      <thead>
				                        <tr className="fc-first fc-last">
				                          <th className="fc-agenda-axis fc-widget-header fc-first first-col">&nbsp;</th>
				                          <th className="fc-mon fc-col1 fc-widget-header day-col">Monday</th>
				                          <th className="fc-tue fc-col2 fc-widget-header day-col">Tuesday</th>
				                          <th className="fc-wed fc-col3 fc-widget-header day-col">Wednesday</th>
				                          <th className="fc-thu fc-col4 fc-widget-header day-col">Thursday</th>
				                          <th className="fc-fri fc-col5 fc-widget-header day-col fc-last">Friday</th>
				                        </tr>
				                      </thead>

				                      <tbody>
				                        <tr className="fc-first fc-last">
				                          <th className="fc-agenda-axis fc-widget-header fc-first">&nbsp;</th>
				                          <td className="fc-col0 fc-mon fc-widget-content">
				                            <div className="box-height">
				                              <div className="fc-day-content"><div className="prel">&nbsp;</div></div>
				                            </div>
				                          </td>

				                          <td className="fc-col1 fc-tue fc-widget-content">
				                            <div>
				                              <div className="fc-day-content"><div className="prel">&nbsp;</div></div>
				                            </div>
				                          </td>

				                          <td className="fc-col2 fc-wed fc-widget-content">
				                            <div><div className="fc-day-content"><div className="prel">&nbsp;</div></div>
				                            </div>
				                          </td>

				                          <td className="fc-col3 fc-thu fc-widget-content">
				                            <div>
				                              <div className="fc-day-content">
				                                <div className="prel">&nbsp;</div>
				                              </div>
				                            </div>
				                          </td>

				                          <td className="fc-col4 fc-fri fc-widget-content">
				                            <div>
				                              <div className="fc-day-content"><div className="prel">&nbsp;</div></div>
				                            </div>
				                          </td>

				                          <td className="fc-agenda-gutter fc-widget-content fc-last gutter1">&nbsp;</td>
				                        </tr>
				                      </tbody>
				                    </table>

				                    <div className="before-before-courses2">
				                      <div className="fc-event-container before-courses">

				                      </div>

				                      <table className="fc-agenda-allday full-width" cellSpacing="0">
				                        <tbody>
				                          <tr>
				                            <th className="fc-widget-header fc-agenda-axis tt-time" >Time</th>
				                            <td>
				                              <div className="fc-day-content">
				                                <div className="prel after-time"></div>
				                              </div>
				                            </td>

				                          </tr>
				                        </tbody>
				                      </table>

				                      <div className="fc-agenda-divider fc-widget-header">
				                        <div className="fc-agenda-divider-inner"></div>
				                      </div>

				                      <div className="tt-scroll">
				                        <div className="before-before-courses">
				                          <div className="fc-event-container before-courses">
				                            
				                          	{slots}
				                          </div>

				                          <table className="fc-agenda-slots full-width" cellSpacing="0">

				                            <tbody>
				                              <tr className="fc-slot0 ">
				                                <th className="fc-agenda-axis fc-widget-header">8am</th>
				                                <td className="fc-widget-content">
				                                  <div className="prel">&nbsp;</div>
				                                </td>
				                              </tr>
				                              <tr className="fc-slot1 fc-minor">
				                                <th className="fc-agenda-axis fc-widget-header">&nbsp;</th>
				                                <td className="fc-widget-content">
				                                  <div className="prel">&nbsp;</div>
				                                </td>
				                              </tr>

				                              <tr className="fc-slot2 ">
				                                <th className="fc-agenda-axis fc-widget-header">9am</th>
				                                <td className="fc-widget-content">
				                                  <div className="prel">&nbsp;</div>
				                                </td>
				                              </tr>

				                              <tr className="fc-slot3 fc-minor">
				                                <th className="fc-agenda-axis fc-widget-header">&nbsp;</th>
				                                <td className="fc-widget-content">
				                                  <div className="prel">&nbsp;</div>
				                                </td>
				                              </tr>

				                              <tr className="fc-slot4 ">
				                                <th className="fc-agenda-axis fc-widget-header">10am</th>
				                                <td className="fc-widget-content">
				                                  <div className="prel">&nbsp;</div>
				                                </td>
				                              </tr>

				                              <tr className="fc-slot5 fc-minor">
				                                <th className="fc-agenda-axis fc-widget-header">&nbsp;</th>
				                                <td className="fc-widget-content">
				                                  <div className="prel">&nbsp;</div>
				                                </td>
				                              </tr>

				                              <tr className="fc-slot6 ">
				                                <th className="fc-agenda-axis fc-widget-header">11am</th>
				                                <td className="fc-widget-content">
				                                  <div className="prel">&nbsp;</div>
				                                </td>
				                              </tr>

				                              <tr className="fc-slot7 fc-minor">
				                                <th className="fc-agenda-axis fc-widget-header">&nbsp;</th>
				                                <td className="fc-widget-content">
				                                  <div className="prel">&nbsp;</div>
				                                </td>
				                              </tr>

				                              <tr className="fc-slot8 ">
				                                <th className="fc-agenda-axis fc-widget-header">12pm</th>
				                                <td className="fc-widget-content">
				                                  <div className="prel">&nbsp;</div>
				                                </td>
				                              </tr>

				                              <tr className="fc-slot9 fc-minor">
				                                <th className="fc-agenda-axis fc-widget-header">&nbsp;</th>
				                                <td className="fc-widget-content">
				                                  <div className="prel">&nbsp;</div>
				                                </td>
				                              </tr>

				                              <tr className="fc-slot26 "><th className="fc-agenda-axis fc-widget-header">1pm</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot27 fc-minor"><th className="fc-agenda-axis fc-widget-header">&nbsp;</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot28 "><th className="fc-agenda-axis fc-widget-header">2pm</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot29 fc-minor"><th className="fc-agenda-axis fc-widget-header">&nbsp;</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot30 "><th className="fc-agenda-axis fc-widget-header">3pm</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot31 fc-minor"><th className="fc-agenda-axis fc-widget-header">&nbsp;</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot32 "><th className="fc-agenda-axis fc-widget-header">4pm</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot33 fc-minor"><th className="fc-agenda-axis fc-widget-header">&nbsp;</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot34 "><th className="fc-agenda-axis fc-widget-header">5pm</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot35 fc-minor"><th className="fc-agenda-axis fc-widget-header">&nbsp;</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot36 "><th className="fc-agenda-axis fc-widget-header">6pm</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot37 fc-minor"><th className="fc-agenda-axis fc-widget-header">&nbsp;</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot38 "><th className="fc-agenda-axis fc-widget-header">7pm</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot39 fc-minor"><th className="fc-agenda-axis fc-widget-header">&nbsp;</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot40 "><th className="fc-agenda-axis fc-widget-header">8pm</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot41 fc-minor"><th className="fc-agenda-axis fc-widget-header">&nbsp;</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot42 "><th className="fc-agenda-axis fc-widget-header">9pm</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot43 fc-minor"><th className="fc-agenda-axis fc-widget-header">&nbsp;</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot44 "><th className="fc-agenda-axis fc-widget-header">10pm</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot45 fc-minor"><th className="fc-agenda-axis fc-widget-header">&nbsp;</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot46 "><th className="fc-agenda-axis fc-widget-header">11pm</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr><tr className="fc-slot47 fc-minor"><th className="fc-agenda-axis fc-widget-header">&nbsp;</th><td className="fc-widget-content"><div className="prel">&nbsp;</div></td></tr>

	                                      </tbody>
	                                    </table>
	                                  </div>
	                                </div>
	                              </div>
	                            </div>
	                          </div>

                             </div>
                           </section>
                         </section>
                       </section>
		              </aside>
		            </section>
		            <a href="#" className="hide nav-off-screen-block" data-toggle="className:nav-off-screen, open" data-target="#nav,html"></a>
		          </section>

		        </section>

		      </section>

		    </section>


		</div>
	</div>
		);
	},

	componentWillUpdate: function() {
	},

	componentDidMount: function (props,state,root) {
		var after = $(".side-menu-container").fadeOut();
		this.maybeRemoveSearchResults();
	},
	beginTutorial: function() {
	  if($(window).width() <=768){return;} // no tutorial on mobile
	  +_.bind(function ($) {

	    $(_.bind(function(){


	      var intro = introJs();

	      intro.setOptions({
	        steps: [
	        {
	            element: '.tt-logo',
	            intro: '<p class="h4 text-uc"><strong>Welcome to Semester.ly!</strong></p><p>A course scheduler to help you find the best schedule with ease. Click Next to start a quick tutorial on how to get the most out of Semester.ly.</p>',
	            position: 'right'
	          },
	          {
	            element: '.searchInput',
	            intro: '<p class="h4 text-uc"><strong>1: Search</strong></p><p>This is the search bar. You\'ll find all your courses here –– when you are ready, click try, search for a course and click the (<i class="fa fa-plus"></i>) button to add it!</p>',
	            position: 'right'
	          },
	         
	        ],
	        showBullets: true,
	      });
	      intro.setOptions({
	        exitOnOverlayClick: false
	      });

	      intro.start();
	      intro.oncomplete((function() {
	      	this.setState({tutorial: true});
		}).bind(this));
	      

	    }, this));
	  }, this)(jQuery);



	},

	componentDidUpdate: function (props,state,root) {
		var url_split = this.generateUrl().split("/");
		var cookie = url_split[url_split.length - 1];
		document.cookie="data=" + cookie + "; expires=Sat, 31 Dec 2016 12:00:00 UTC;";
		var clip = new ZeroClipboard($("#copy_tt_url"));
		$("[data-toggle=popover]").popover();

		$("[data-toggle=tooltip]").tooltip();
		var window_width = $(window).width();
		for (var i =2;i<=9;i++) {
			if(window_width > 1080){
				$(".day-"+i).css('left', 265+(i-1)*115 + "px");
			}
			else {
				if(window.innerWidth > 767){
					if(i == 2) {$(".day-1").css('left', "264px");}
					$(".day-"+i).css('left', 265+(i-1)*89 + "px");
				}
				else {
					if(i == 2) {$(".day-1").css('left', "30px");}
					$(".day-"+i).css('left', 30+(i-1)*89 + "px");
				}

			}
		}
	},

	maybeRemoveSearchResults: function() {
		$("#wrapper").click(_.bind(function(e){
			if ($(window).width() > 767) {return;}
	    	var x = e.pageX;	
	    	var y = e.pageY;
	    	var sr = $(".search-results");
	    	if (sr != [] && sr != null && sr.length > 0) {
	    		if (x < sr.offset().left || y > sr.offset().top + sr.height()) {
	    			this.refs.tta.nullifyResults();
	    		}
	    	}
		}, this));
	},

	switchSidePanel: function() {

		if (this.state.search) {
			var now = $(".course-search-container");
			var after = $(".side-menu-container");
		}
		else {
			var now = $(".side-menu-container");
			var after = $(".course-search-container");
		}

		now.fadeOut(300, _.bind(function() {
			this.setState({search: !this.state.search});
			after.fadeIn(300);
    	}, this));

	},

});

$(window).unload(function(){        
	$.ajax({
	    type: 'POST',
	    async: false,
	    url: '/exit',
	    data: {u_sid: sid}
	});
});

ReactDOM.render(
  <TimetablePage />,
  document.getElementById('timetable-page-container')
);
