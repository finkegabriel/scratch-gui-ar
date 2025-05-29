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
            'handleStopAllClick',
            'handleArImporterClick'
        ]);
        this.state = {
            isArImporterEnabled: false
        };
        this.videoElement = null; // Add this line
        this.cameraStream = null;
    }

    toggleArImporter() {
        this.setState(prevState => ({
            isArImporterEnabled: !prevState.isArImporterEnabled
        }));
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
    handleStopAllClick (e) {
        e.preventDefault();
        this.props.vm.stopAll();
    }
    handleDebugCamera (isOn) {
        if (isOn) {
            const channel = new BroadcastChannel('webcam');
            const video = document.createElement('video');
            video.autoplay = true;
            document.body.appendChild(video);
            this.videoElement = video; // Store the video element

            navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
                video.srcObject = stream;
                this.cameraStream = stream;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                setInterval(() => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0);
                    canvas.toBlob(blob => {
                        if (blob) {
                            blob.arrayBuffer().then(buffer => {
                                channel.postMessage(buffer);
                            });
                        }
                    }, 'image/jpeg', 0.5); // Adjust quality for bandwidth
                }, 100); // Send every 100ms (~10fps)
            });
        } else {
            console.log('Debug camera is off');
            if (this.cameraStream) {
                // Stop all tracks of the media stream
                this.cameraStream.getTracks().forEach(track => track.stop());
                this.cameraStream = null;
            }

            // Remove the video element from the DOM
            if (this.videoElement) {
                this.videoElement.remove();
                this.videoElement = null;
            }
        }
    }

    handleArImporterClick (e) {
        // e.preventDefault();
        console.log('AR Importer clicked', this.state.isArImporterEnabled);
        this.handleDebugCamera(!this.state.isArImporterEnabled); // Call the debug camera function
        // This is where I will import a yolo model that is trained on scratch blocks

        this.toggleArImporter.bind(this)(); // Toggle the AR importer state
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
