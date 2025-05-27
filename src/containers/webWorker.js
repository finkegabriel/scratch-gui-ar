self.onmessage = function (event) {
    console.log('Message received in Web Worker:', event.data);

    if (event.data.type === 'streamFrame') {
        // Handle the frame data (e.g., log it or process it)
        console.log('Frame received:', event.data.frame);
    }

    // Example: Send a response back to the main thread
    self.postMessage({ message: 'Frame processed by Web Worker' });
};