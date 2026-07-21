const SECRET_NICKNAME = "meanie";

const lockScreen = document.getElementById('lock-screen');
const passInput = document.getElementById('passcode-input');
const unlockBtn = document.getElementById('unlock-btn');
const lockError = document.getElementById('lock-error');

const video = document.getElementById('webcam');
const startBtn = document.getElementById('start-btn');
const countdownEl = document.getElementById('countdown-overlay');
const canvas = document.getElementById('photo-canvas');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('result-modal');
const stripContainer = document.getElementById('strip-container');
const downloadBtn = document.getElementById('download-btn');
const retakeBtn = document.getElementById('retake-btn');
const themeSelect = document.getElementById('theme-select');

let capturedPhotos = [];

unlockBtn.addEventListener('click', checkPasscode);
passInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkPasscode(); });

function checkPasscode() {
  const enteredCode = passInput.value.trim().toLowerCase();
  if (enteredCode === SECRET_NICKNAME) {
    lockScreen.style.display = 'none';
    initWebcam();
  } else {
    lockError.classList.remove('hidden');
    passInput.value = '';
    passInput.style.borderColor = '#ff4d6d';
    setTimeout(() => { passInput.style.borderColor = '#333'; }, 1000);
  }
}

async function initWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = stream;
  } catch (err) {
    alert("Please allow camera access to use the photobooth!");
  }
}

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  capturedPhotos = [];

  for (let i = 0; i < 4; i++) {
    await runCountdown(3);
    takePhoto();
  }

  buildPhotoStrip();
  startBtn.disabled = false;
});

function runCountdown(seconds) {
  return new Promise((resolve) => {
    countdownEl.classList.remove('hidden');
    let count = seconds;
    countdownEl.innerText = count;

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        countdownEl.innerText = count;
      } else {
        clearInterval(timer);
        countdownEl.classList.add('hidden');
        resolve();
      }
    }, 1000);
  });
}

function takePhoto() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  const tempCtx = tempCanvas.getContext('2d');
  
  tempCtx.translate(tempCanvas.width, 0);
  tempCtx.scale(-1, 1);
  tempCtx.drawImage(video, 0, 0);

  capturedPhotos.push(tempCanvas.toDataURL('image/png'));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

themeSelect.addEventListener('change', () => {
  if (capturedPhotos.length > 0) buildPhotoStrip();
});

async function buildPhotoStrip() {
  const selectedTheme = themeSelect.value;

  try {
    const frameImg = await loadImage(`${selectedTheme}.png`);

    canvas.width = frameImg.width;
    canvas.height = frameImg.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (selectedTheme === 'template1') {
      const slotW = canvas.width * 0.65;
      const slotH = canvas.height * 0.16;
      const xPos = canvas.width * 0.175;
      const startY = canvas.height * 0.20;
      const gap = canvas.height * 0.182;

      for (let i = 0; i < 4; i++) {
        if (capturedPhotos[i]) {
          const photo = await loadImage(capturedPhotos[i]);
          ctx.drawImage(photo, xPos, startY + (i * gap), slotW, slotH);
        }
      }
    } 
    else if (selectedTheme === 'template2') {
      const slotW = canvas.width * 0.58;
      const slotH = canvas.height * 0.23;

      if (capturedPhotos[0]) ctx.drawImage(await loadImage(capturedPhotos[0]), canvas.width * 0.14, canvas.height * 0.10, slotW, slotH);
      if (capturedPhotos[1]) ctx.drawImage(await loadImage(capturedPhotos[1]), canvas.width * 0.38, canvas.height * 0.36, slotW, slotH);
      if (capturedPhotos[2]) ctx.drawImage(await loadImage(capturedPhotos[2]), canvas.width * 0.08, canvas.height * 0.61, slotW, slotH);
    } 
    else if (selectedTheme === 'template3') {
      const slotW = canvas.width * 0.68;
      const slotH = canvas.height * 0.22;
      const xPos = canvas.width * 0.16;

      if (capturedPhotos[0]) ctx.drawImage(await loadImage(capturedPhotos[0]), xPos, canvas.height * 0.05, slotW, slotH);
      if (capturedPhotos[1]) ctx.drawImage(await loadImage(capturedPhotos[1]), xPos, canvas.height * 0.36, slotW, slotH);
      if (capturedPhotos[2]) ctx.drawImage(await loadImage(capturedPhotos[2]), xPos, canvas.height * 0.68, slotW, slotH);
    } 
    else if (selectedTheme === 'template4' || selectedTheme === 'template5') {
      const slotW = canvas.width * 0.80;
      const slotH = canvas.height * 0.32;
      const xPos = canvas.width * 0.10;

      if (capturedPhotos[0]) ctx.drawImage(await loadImage(capturedPhotos[0]), xPos, canvas.height * 0.18, slotW, slotH);
      if (capturedPhotos[1]) ctx.drawImage(await loadImage(capturedPhotos[1]), xPos, canvas.height * 0.58, slotW, slotH);
    }

    ctx.drawImage(frameImg, 0, 0);

  } catch (err) {
    console.error("Frame failed to load.", err);
  }

  stripContainer.innerHTML = '';
  const finalImage = new Image();
  finalImage.src = canvas.toDataURL('image/png');
  finalImage.style.width = '200px';
  finalImage.style.border = '2px solid #333';
  finalImage.style.borderRadius = '6px';
  stripContainer.appendChild(finalImage);

  modal.classList.remove('hidden');
}

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'kawaii-photobooth-strip.png';
  link.href = canvas.toDataURL();
  link.click();
});

retakeBtn.addEventListener('click', () => { modal.classList.add('hidden'); });
