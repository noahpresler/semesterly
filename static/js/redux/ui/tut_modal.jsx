import React from 'react';
import Modal from 'boron/DropModal';
import classNames from 'classnames';
import { browserSupportsLocalStorage } from '../util.jsx';

export class TutModal extends React.Component {
	constructor(props) {
        super(props);
        this.state = { tutPosition: 1 };
        this.next = this.next.bind(this);
        this.prev = this.prev.bind(this);
        this.hide = this.hide.bind(this);
    }
	componentDidMount(nextProps) {
		let tutorial = JSON.parse(localStorage.getItem('tutorial'));
		if(!tutorial || !tutorial.modalTutShown)
			this.refs.modal.show();
		$(document.body).on('keydown', (e) => {
			e.stopPropagation();
		});
	}
	componentDidUpdate() {
        $(".max-modal").parent().css("display", "block");
    }
	next() {
		this.setState({tutPosition: this.state.tutPosition + 1});
	}
	prev() {
		this.setState({tutPosition: this.state.tutPosition - 1});
	}
	hide() {
		this.refs.modal.hide();
		if (browserSupportsLocalStorage()) {
			localStorage.setItem("tutorial",JSON.stringify({modalTutShown: true}));
		}
	}
	render() {
		let modalStyle = {
			maxWidth: '500px',
			maxHeight: '550px'
		};
		let left = this.state.tutPosition > 1 ? <i className="action fa fa-chevron-left" onClick={this.prev}/> : null;
		let right = this.state.tutPosition < 4 ? <i className="action fa fa-chevron-right" onClick={this.next}/> : null;
		right = this.state.tutPosition == 4 ? <h4 className="action" onClick={this.hide}>Done</h4> : right;
		let backgroundColor;
		switch(this.state.tutPosition) {
			case 1:
				modalStyle.backgroundColor = "#27AE60";
				break;
			case 2:
				modalStyle.backgroundColor = "#2980B9";
				break;
			case 3:
				modalStyle.backgroundColor = "#8E44AD";
				break;
			case 4:
				modalStyle.backgroundColor = "#E74C3C";
				break;
		}
		return (
			<Modal ref="modal"
				className="tut-modal max-modal"
				closeOnClick={false}
                keyboard={false}
				modalStyle={modalStyle}
                onShow={() => $(".max-modal").unwrap()}
				>
				<div id="tut-wrapper">
					<div id="tut-nav">
						{ left }
						<p>Welcome to Semester.ly</p>
						{ right }
					</div>
					<img className="tut-img" src={"/static/img/tutorial/step1.png"}
						style={{display: this.state.tutPosition == 1 ? 'inline' : 'none', opacity: this.state.tutPosition == 1 ? "1" : "0"}}
						width="100%" />
					<img className="tut-img" src={"/static/img/tutorial/step2.png"}
						style={{display: this.state.tutPosition == 2 ? 'inline' : 'none', opacity: this.state.tutPosition == 2 ? "1" : "0"}}
						width="100%" />
					<img className="tut-img" src={"/static/img/tutorial/step3.png"}
						style={{display: this.state.tutPosition == 3 ? 'inline' : 'none', opacity: this.state.tutPosition == 3 ? "1" : "0"}}
						width="100%" />
					<img className="tut-img" src={"/static/img/tutorial/step4.png"}
						style={{display: this.state.tutPosition == 4 ? 'inline' : 'none', opacity: this.state.tutPosition == 4 ? "1" : "0"}}
						width="100%" />
				</div>
			</Modal>
		);
	}
}
