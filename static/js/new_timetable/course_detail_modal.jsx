

var styles = {
  btn: {
      margin: '1em auto',
      padding: '1em 2em',
      outline: 'none',
      fontSize: 16,
      fontWeight: '600',
      background: '#C94E50',
      color: '#FFFFFF',
      border: 'none'
  },
  container: {
      padding: '2em',
      textAlign: 'center'
  },
  title: {
    margin: 0,
    color: '#C94E50',
    fontWeight: 400
  }
}

var Example = React.createClass({

    toggleDialog: function(ref){
        return function(){
            this.refs[ref].toggle();
        }.bind(this)
    },

    getContent: function(modalName){
        return <div style={styles.container}>
        <h2 style={styles.title}><strong>Boron</strong> is amazing</h2>
            <button style={styles.btn} onClick={this.toggleDialog(modalName)}>Close</button>
        </div>
    },

    getTiggerAndModal: function(modalName){
        var Modal = Boron[modalName];

        return <div>
        <button style={styles.btn} onClick={this.toggleDialog(modalName)}>Open {modalName}</button>

        <Modal ref={modalName}>{this.getContent(modalName)}</Modal>
        </div>
    },
    render: function() {
        var self = this;
        return (
            <div style={styles.container}>
                {['OutlineModal', 'ScaleModal', 'FadeModal', 'FlyModal', 'DropModal', 'WaveModal'].map(function(name){
                    return self.getTiggerAndModal(name)
                })}
            </div>
        );
    }
});


// ReactDOM.render(
//   <Example />,
//   document.getElementById('lol')
// );


