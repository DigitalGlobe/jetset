import React from 'react';
import PropTypes from 'prop-types';

export default class Gist extends React.Component {

  static propTypes = {
    gist: PropTypes.string.isRequired, // e.g. "username/id"
    file: PropTypes.string // to embed a single specific file from the gist
  }

  static gistCallbackId = 0

  static nextGistCallback = () => "embed_gist_callback_" + Gist.gistCallbackId++

  // The Gist JSON data includes a stylesheet to add to the page
  // to make it look correct. `addStylesheet` ensures we only add
  // the stylesheet one time.
  static stylesheetAdded = false

  static addStylesheet = function(href) {
    if (!Gist.stylesheetAdded) {
      Gist.stylesheetAdded = true;
      var link = document.createElement('link');
      link.type = "text/css";
      link.rel = "stylesheet";
      link.href = href;

      document.head.appendChild(link);
    }
  }

  mounted = false;

  constructor( props ) {
    super( props );
    this.state = {
      loading: true,
      src: ""
    };
  }

  componentWillMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  componentDidMount() {
    this.gistIt( this.props );
  }

  componentWillReceiveProps( nextProps ) {
    if ( this.props.gist !== nextProps.gist ) this.gistIt( nextProps );
  }

  gistIt( props ) {
    // Create a JSONP callback that will set our state
    // with the data that comes back from the Gist site
    var gistCallback = Gist.nextGistCallback();
    window[gistCallback] = function(gist) {
      if (this.mounted) {
        this.setState({
          loading: false,
          src: gist.div
        });
        Gist.addStylesheet(gist.stylesheet);
      }
    }.bind(this);

    var url = "https://gist.github.com/" + props.gist + ".json?callback=" + gistCallback;
    if (props.file) {
      url += "&file=" + props.file;
    }

    // Add the JSONP script tag to the document.
    this.script = document.createElement('script');
    this.script.type = 'text/javascript';
    this.script.src = url;
    document.head.appendChild(this.script);
  }

  render() {
    if (this.state.loading) {
      return <div>loading...</div>;
    } else {
      return <div style={{ float: 'right', width: '50%'}}><div dangerouslySetInnerHTML={{__html: this.state.src}} /></div>;
    }
  }
}
