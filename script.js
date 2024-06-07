let audioCtx, analyser, bufferLength, dataArray;
const colorThreshold = 1;
let micSource;

const canvas = document.getElementById('waveform');
const canvasCtx = canvas.getContext('2d');
const WIDTH = canvas.width = window.innerWidth;
const HEIGHT = canvas.height = window.innerHeight;

let mode = 'classic';
let phase = 0; // Declare and initialize phase

function setMode(newMode) {
    mode = newMode;
    updateActiveButton(newMode);
}

function updateActiveButton(selectedMode) {
    const buttons = document.querySelectorAll('.mode-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(`${selectedMode}Button`).classList.add('active');
}

function toggleUI() {
    const hideUI = document.getElementById('hideUI').checked;
    const elements = document.querySelectorAll('.menu, .sidebar');
    elements.forEach(el => {
        el.style.display = hideUI ? 'none' : 'block';
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

function startVisualization() {
    document.querySelector('.start-button').style.display = 'none';
    document.getElementById('intro-waveform').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('waveform').style.display = 'block';
    canvas.style.display = 'block';

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.5;
    bufferLength = analyser.fftSize;
    dataArray = new Uint8Array(bufferLength);

    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const micSelect = document.getElementById('micSelect');
            if (micSelect) {
                devices.forEach(device => {
                    if (device.kind === 'audioinput') {
                        const option = document.createElement('option');
                        option.value = device.deviceId;
                        option.text = device.label || `Microphone ${micSelect.length + 1}`;
                        micSelect.appendChild(option);
                    }
                });
            }
        })
        .catch(error => console.error('Error accessing devices:', error));

    changeMic();

    draw();
}

function changeMic(deviceId) {
    if (audioCtx && micSource) {
        micSource.disconnect();
    }
    navigator.mediaDevices.getUserMedia({ audio: { deviceId: deviceId ? { exact: deviceId } : undefined } })
        .then(stream => {
            micSource = audioCtx.createMediaStreamSource(stream);
            micSource.connect(analyser);
        })
        .catch(error => console.error('Error accessing microphone:', error));
}

function drawClassic() {
    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'black';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'white';

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let y = v * HEIGHT / 2;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}

function drawChannels() {
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = 'black';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    const barWidth = (WIDTH / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    const yOffset = HEIGHT / 2;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * 3; // Increase the height to make it larger

        const color = 'rgb(' + (barHeight + 100) + ',50,50)';
        canvasCtx.fillStyle = color;

        // Draw top bars
        canvasCtx.fillRect(x, yOffset - barHeight / 2, barWidth, barHeight / 2);
        // Draw bottom bars
        canvasCtx.fillRect(x, yOffset, barWidth, barHeight / 2);

        x += barWidth + 1;
    }
}

function drawColorful() {
    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'black';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;
    let maxAmplitude = 0;

    for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let y = v * HEIGHT / 2;

        if (v * 128.0 > maxAmplitude) {
            maxAmplitude = v * 128.0;
        }

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();

    if (maxAmplitude > colorThreshold) {
        canvasCtx.strokeStyle = getRandomColor();
    }
}

function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

function drawSmooth() {
    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'black';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'white';

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;
    let y = HEIGHT / 2;

    for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let targetY = v * HEIGHT / 2;

        // Smooth the transition
        y += (targetY - y) * 0.1;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}

function drawLayered() {
    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'black';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'white';

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;
    let y = HEIGHT / 2;

    for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let targetY = v * HEIGHT / 2;  // Reduced amplitude
        let randomOffset = (Math.sin(phase + i * 0.02) + Math.sin(phase + i * 0.03) * 0.5 + Math.random() * 0.3) * (HEIGHT / 50);  // Reduced randomness effect 

        y += (targetY - y) * 0.5 + randomOffset;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();

    phase += 0.03; // Update phase for the next frame
}

function draw() {
    requestAnimationFrame(draw);

    switch (mode) {
        case 'classic':
            drawClassic();
            break;
        case 'channels':
            drawChannels();
            break;
        case 'colorful':
            drawColorful();
            break;
        case 'smooth':
            drawSmooth();
            break;
        case 'layered':
            drawLayered();
            break;
    }
}

// Set the initial active button
updateActiveButton(mode);

// Function for animating the intro waveform
function animateIntroWaveform() {
    const introCanvas = document.getElementById('intro-waveform');
    const introCtx = introCanvas.getContext('2d');
    introCanvas.width = window.innerWidth;
    introCanvas.height = window.innerHeight;

    let phase = 0;

    function drawIntroWave() {
        introCtx.clearRect(0, 0, introCanvas.width, introCanvas.height);

        introCtx.lineWidth = 1;
        introCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';

        const centerY = introCanvas.height / 2;
        const width = introCanvas.width;

        introCtx.beginPath();
        for (let x = 0; x < width; x++) {
            const y = centerY + (Math.sin(phase + x * 0.02) + Math.sin(phase + x * 0.03) * 0.5 + Math.random() * 0.3) * (introCanvas.height / 8);
            if (x === 0) {
                introCtx.moveTo(x, y);
            } else {
                introCtx.lineTo(x, y);
            }
        }
        introCtx.stroke();

        phase += 0.03;
        requestAnimationFrame(drawIntroWave);
    }

    drawIntroWave();
}

// Start the intro waveform animation
animateIntroWaveform();
