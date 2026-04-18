const API_URL = `http://${window.location.hostname}:5555`;

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewCanvas = document.getElementById('previewCanvas');
const previewImage = document.getElementById('previewImage');
const previewInfo = document.getElementById('previewInfo');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const resultCount = document.getElementById('resultCount');
const resultText = document.getElementById('resultText');
const analyseBtn = document.getElementById('analyseBtn');
const clearBtn = document.getElementById('clearBtn');
const buttonGroup = document.getElementById('buttonGroup');
const errorMessage = document.getElementById('errorMessage');

let selectedFile = null;

// Event listeners
uploadArea.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        handleFileSelect(file);
    }
});

// Drag and drop box
uploadArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (event) => {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFileSelect(file);
    }
});

analyseBtn.addEventListener('click', analyseImage);
clearBtn.addEventListener('click', clearImage);

// Handle file selection and validation
function handleFileSelect(file) {
    selectedFile = file;

    // Validate file type, only allow JPEG and PNG
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        showError('Please upload a JPEG or PNG image');
        return;
    }

    // Validate file size (assuming no larger than 50MB)
    if (file.size > 50 * 1024 * 1024) {
        showError('File is too large (max 50MB)');
        return;
    }

    // Show preview of the uploaded image
    const reader = new FileReader();
    reader.onload = (event) => {
        previewImage.src = event.target.result;
        previewInfo.textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)}MB`;
        imagePreview.style.display = 'block';
        uploadArea.style.display = 'none';
        buttonGroup.style.display = 'flex';
        result.style.display = 'none';
        clearBoxes();
        clearError();
    };
    reader.readAsDataURL(file);
}

//analyse the image by sending it to the backend API
async function analyseImage() {
    if (!selectedFile) {
        showError('Please select an image first');
        return;
    }

    // Send the image to the backend API for analysis
    try {
        analyseBtn.disabled = true;
        loading.style.display = 'block';
        result.style.display = 'none';
        clearError();

        const formData = new FormData();
        formData.append('image', selectedFile);

        const response = await fetch(`${API_URL}/count`, {
            method: 'POST',
            body: formData,
        });

        loading.style.display = 'none';

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        displayResult(data);
    } catch (error) {
        loading.style.display = 'none';
        showError(`Failed to analyse image: ${error.message}`);
    } finally {
        analyseBtn.disabled = false;
    }
}

// Display the result of the analysis
function displayResult(data) {
    resultCount.textContent = data.count;
    resultText.textContent = data.count === 1 ? 'mite detected' : 'mites detected';
    result.classList.remove('error');
    result.classList.add('success');
    result.style.display = 'block';
    drawBoxes(data.boxes || []);
}

// Draw translucent red boxes over the preview image from xywhn [cx, cy, w, h]
function drawBoxes(boxes) {
    clearBoxes();
    for (const { xywhn } of boxes) {
        const [cx, cy, w, h] = xywhn;
        const box = document.createElement('div');
        box.className = 'detection-box';
        box.style.left = `${(cx - w / 2) * 100}%`;
        box.style.top = `${(cy - h / 2) * 100}%`;
        box.style.width = `${w * 100}%`;
        box.style.height = `${h * 100}%`;
        previewCanvas.appendChild(box);
    }
}

function clearBoxes() {
    previewCanvas.querySelectorAll('.detection-box').forEach(el => el.remove());
}

//clear the selected image and reset the UI
function clearImage() {
    selectedFile = null;
    imageInput.value = '';
    imagePreview.style.display = 'none';
    uploadArea.style.display = 'block';
    buttonGroup.style.display = 'none';
    result.style.display = 'none';
    clearBoxes();
    clearError();
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Clear error message
function clearError() {
    errorMessage.style.display = 'none';
}
