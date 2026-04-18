
const API_URL = 'http://localhost:5555';

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const result = document.getElementById('result');
const resultCount = document.getElementById('resultCount');
const resultText = document.getElementById('resultText');
const analyseBtn = document.getElementById('analyseBtn');
const clearBtn = document.getElementById('clearBtn');
const buttonGroup = document.getElementById('buttonGroup');

let selectedFile = null;

// Event listeners
uploadArea.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelect(file);
    }
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFileSelect(file);
    }
});

analyseBtn.addEventListener('click', analyseImage);
clearBtn.addEventListener('click', clearImage);

// Functions
function handleFileSelect(file) {
    selectedFile = file;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert('Please upload a JPEG or PNG image');
        return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
        alert('File is too large (max 50MB)');
        return;
    }

    // Show buttons
    uploadArea.style.display = 'none';
    buttonGroup.style.display = 'flex';
    result.style.display = 'none';
}

async function analyseImage() {
    if (!selectedFile) {
        alert('Please select an image first');
        return;
    }

    try {
        analyseBtn.disabled = true;
        analyseBtn.textContent = 'Analyzing...';

        const formData = new FormData();
        formData.append('image', selectedFile);

        const response = await fetch(`${API_URL}/count`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        displayResult(data.count);
    } catch (error) {
        alert(`Failed to analyse image: ${error.message}`);
    } finally {
        analyseBtn.disabled = false;
        analyseBtn.textContent = 'Analyze';
    }
}

function displayResult(count) {
    resultCount.textContent = count;
    resultText.textContent = count === 1 ? 'mite detected' : 'mites detected';
    result.classList.remove('error');
    result.classList.add('success');
    result.style.display = 'block';
}

function clearImage() {
    selectedFile = null;
    imageInput.value = '';
    uploadArea.style.display = 'block';
    buttonGroup.style.display = 'none';
    result.style.display = 'none';
}

