import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import VM from 'scratch-vm';
import { connect } from 'react-redux';
import ControlsComponent from '../components/controls/controls.jsx';

class Controls extends React.Component {
    constructor(props) {
        super(props);
        bindAll(this, [
            'handleGreenFlagClick',
            'handleStopAllClick',
            'handleArImporterClick' // Add this to bind the method
        ]);
    }
    handleGreenFlagClick(e) {
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
    handleStopAllClick(e) {
        e.preventDefault();
        this.props.vm.stopAll();
    }
    handleArImporterClick(e) {
        e.preventDefault();
        console.log('AR Importer clicked');

        // Create a new Web Worker
        const worker = new Worker(new URL('webWorker.js', import.meta.url));

        // Open a new browser tab
        const newTab = window.open();
        let reader; // Declare reader outside the scope of .then
        let stream;

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(videoStream => {
                stream = videoStream;

                // Get the video stream's track
                const track = stream.getVideoTracks()[0];

                // Create a MediaStreamTrackProcessor to get frames from the video track
                const processor = new MediaStreamTrackProcessor({ track });
                reader = processor.readable.getReader();

                // Function to read frames and send them to the worker
                const sendFrame = () => {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            console.log('Stream ended');
                            return;
                        }

                        // Use createImageBitmap to convert the VideoFrame to an ImageBitmap
                        createImageBitmap(value).then(imageBitmap => {
                            // Send the ImageBitmap to the worker
                            worker.postMessage({ type: 'streamFrame', frame: imageBitmap }, [imageBitmap]);
                            sendFrame(); // Send the next frame
                        }).catch(error => {
                            console.error('Error creating ImageBitmap:', error);
                        });

                        // Close the VideoFrame to release resources
                        value.close();
                    }).catch(error => {
                        console.error('Error reading frame:', error);
                    });
                };

                sendFrame(); // Start sending frames

                // Display a message in the new tab
                newTab.document.body.innerText = 'Streaming webcam using Web Worker...';

                // Listen for messages from the worker
                worker.onmessage = (event) => {
                    console.log('Message from Web Worker:', event.data);
                };
            })
            .catch(error => {
                console.error('Error accessing camera:', error);
                // Optionally, display an error message in the new tab
                newTab.document.body.innerText = 'Error accessing camera: ' + error;
            });

        // Clean up resources when the tab is closed
        newTab.onbeforeunload = () => {
            if (reader) {
                reader.cancel();
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            worker.terminate(); // Terminate the worker when the tab is closed
        };
    }
    render() {
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
