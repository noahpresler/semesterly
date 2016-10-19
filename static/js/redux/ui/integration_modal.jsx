import React from 'react';
import Modal from 'boron/WaveModal';
import classNames from 'classnames';
import IntegrationSlotContainer from './containers/integration_slot_container.jsx'

export class IntegrationModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            sessions: ["test0", "test1"],
            value: 'Hello!'
        };
        this.appendSession = this.appendSession.bind(this);
        this.removeSession = this.removeSession.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.json = "test";
        this.index = 0;
    }
    componentDidUpdate(nextProps) {
        if (this.props.isVisible) {
            this.refs.modal.show();
        }
    }
    appendSession() {
        this.setState({sessions: this.state.sessions.push(this.json)});
    }
    removeSession() {
        this.setState({sessions: this.state.sessions.splice(this.index, 1)});
    }
    handleChange(event) {
        this.setState({value: event.target.value});
    }
    render() {
        let modalStyle = {
            width: '100%'
        };
        let list = this.state.sessions.map(function(session, index){
                        return <li key={ index }>{session}</li>;
                    });
        return (
            <Modal ref="modal"
                className="signup-modal max-modal"
                modalStyle={modalStyle}
                onHide={this.props.toggleIntegrationModal}
                >
                <div id="sessions">
                    <div className="enable pilot">
                        <div className="preference-wrapper">
                            <h3>Would you like to enable Pilot for this course?</h3>
                        </div>
                        <label className="switch switch-slide">
                            <input ref="enable_pilot" className="switch-input" type="checkbox" onChange={this.changeForm} defaultChecked={true}/>
                            <span className="switch-label" data-on="Yes" data-off="No"></span>
                            <span className="switch-handle"></span>
                        </label>
                    </div>
                    <div id="sessions">
                      <IntegrationSlotContainer />
                      <input
                        type="text"
                        value={this.state.value}
                        onChange={this.handleChange}
                      />                    
                    </div>
                    <div id="call-to-action">
                        <a href="/login/facebook/">
                            <div  className="add-integration-button">
                                Add Pilot Session
                            </div>
                        </a>
                    </div>
                </div>
            </Modal>
        );
    }
}
