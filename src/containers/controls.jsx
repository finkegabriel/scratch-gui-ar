import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

import ControlsComponent from '../components/controls/controls.jsx';

class Controls extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleGreenFlagClick',
            'handleStopAllClick'
        ]);
    }
    handleGreenFlagClick (e) {
        e.preventDefault();
        if (e.shiftKey) {
            this.props.vm.setTurboMode(!this.props.turbo);
        } else {
            if (!this.props.isStarted) {
                this.props.vm.start();
            }
            this.props.vm.greenFlag();
        }
    }
    handleStopAllClick (e) {
        e.preventDefault();
        this.props.vm.stopAll();
    }
    handleArImporterClick (e) {
        e.preventDefault();
        console.log('AR Importer clicked');
        // Open a new browser tab
        const newTab = window.open();
        let reader; // Declare reader outside the scope of .then
        let stream;

        navigator.mediaDevices.getUserMedia({video: true})
            .then(videoStream => {
                stream = videoStream;
                // Create a WebSocket connection to the new tab
                const ws = new WebSocket('ws://localhost:8080'); // Replace with your WebSocket server URL

                ws.onopen = () => {
                    console.log('WebSocket connected');

                    // Get the video stream's track
                    const track = stream.getVideoTracks()[0];

                    // Create a MediaStreamTrackProcessor to get frames from the video track
                    const processor = new MediaStreamTrackProcessor({track});
                    reader = processor.readable.getReader(); // Assign to the outer reader

                    // Function to read frames and send them over WebSocket
                    const sendFrame = () => {
                        reader.read().then(({done, value}) => {
                            if (done) {
                                console.log('Stream ended');
                                ws.close();
                                return;
                            }

                            // Convert the frame to a suitable format (e.g., Blob or ArrayBuffer)
                            // and send it over the WebSocket
                            value.convertToImageData().then(imageData => {
                                // Convert ImageData to JSON and send
                                ws.send(JSON.stringify(imageData));
                                sendFrame(); // Send the next frame
                            });
                        }).catch(error => {
                            console.error('Error reading frame:', error);
                            ws.close();
                        });
                    };

                    sendFrame(); // Start sending frames
                };

                ws.onmessage = event => {
                    console.log('Message from server:', event.data);
                };

                ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    // Clean up resources
                    if (reader) {
                        reader.cancel();
                    }
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                    }
                };

                ws.onerror = error => {
                    console.error('WebSocket error:', error);
                };


                // Display a message in the new tab
                newTab.document.body.innerText = 'Streaming webcam...';

            })
            .catch(error => {
                console.error('Error accessing camera:', error);
                // Optionally, display an error message in the new tab
                newTab.document.body.innerText = 'Error accessing camera: ' + error;
            });
    }
    render () {
        const {
            vm, // eslint-disable-line no-unused-vars
            isStarted, // eslint-disable-line no-unused-vars
            projectRunning,
            turbo,
            ...props
        } = this.props;
        return (
            <ControlsComponent
                {...props}
                active={projectRunning}
                turbo={turbo}
                onGreenFlagClick={this.handleGreenFlagClick}
                onStopAllClick={this.handleStopAllClick}
                onClickArImporter={this.handleArImporterClick}
            />
        );
    }
}

Controls.propTypes = {
    isStarted: PropTypes.bool.isRequired,
    projectRunning: PropTypes.bool.isRequired,
    turbo: PropTypes.bool.isRequired,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    isStarted: state.scratchGui.vmStatus.running,
    projectRunning: state.scratchGui.vmStatus.running,
    turbo: state.scratchGui.vmStatus.turbo
});
// no-op function to prevent dispatch prop being passed to component
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Controls);
