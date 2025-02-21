const fs = require('fs');
const path = require('path');

// Create styles directory if it doesn't exist
const stylesDir = path.join(__dirname, 'styles');
if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir);
}

// CSS content
const cssContent = `/* Main Container */
.speedtest-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    font-family: 'Arial', sans-serif;
}

/* Header */
.speedtest-header {
    text-align: center;
    margin-bottom: 30px;
}

.speedtest-header h1 {
    color: #2196F3;
    font-size: 28px;
    margin-bottom: 10px;
}

/* Network Info Section */
.network-info {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    border: 1px solid #e9ecef;
}

.network-info div {
    margin: 8px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

#networkProvider, #connectionType {
    font-weight: 600;
    color: #2196F3;
    padding: 4px 8px;
    background: #e3f2fd;
    border-radius: 4px;
}

/* Speedometer */
.speedometer {
    width: 300px;
    height: 300px;
    margin: 20px auto;
    position: relative;
}

.speed-display {
    position: absolute;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 36px;
    font-weight: bold;
    color: #2196F3;
}

.speed-unit {
    font-size: 16px;
    color: #666;
}

/* Progress Bar */
.progress-container {
    width: 100%;
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    margin: 20px 0;
    overflow: hidden;
}

.progress-bar {
    width: 0;
    height: 100%;
    background: linear-gradient(90deg, #2196F3, #64b5f6);
    transition: width 0.3s ease;
}

/* Test Phase Display */
.test-phase {
    text-align: center;
    font-size: 18px;
    color: #555;
    margin: 15px 0;
    min-height: 27px;
}

/* Results Section */
.results {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin: 30px 0;
}

.result-box {
    text-align: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.result-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
}

.result-value {
    font-size: 24px;
    font-weight: bold;
    color: #2196F3;
}

/* Start Button */
.start-button {
    display: block;
    width: 200px;
    margin: 20px auto;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    color: white;
    background: #2196F3;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.start-button:hover {
    background: #1976D2;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
}

.start-button:disabled {
    background: #90CAF9;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* Responsive Design */
@media (max-width: 768px) {
    .speedtest-container {
        margin: 10px;
        padding: 15px;
    }

    .results {
        grid-template-columns: 1fr;
        gap: 15px;
    }

    .speedometer {
        width: 250px;
        height: 250px;
    }

    .speed-display {
        font-size: 30px;
    }
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.fade-in {
    animation: fadeIn 0.5s ease-in;
}

/* Loading State */
.loading {
    position: relative;
}

.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #2196F3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}`;

// Write CSS file
fs.writeFileSync(path.join(stylesDir, 'speedtest.css'), cssContent);

// Read HTML file
const htmlPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Check if CSS is already linked
if (!htmlContent.includes('styles/speedtest.css')) {
    // Add CSS link to HTML head
    htmlContent = htmlContent.replace('</head>',
        '    <link rel="stylesheet" href="styles/speedtest.css">\n</head>'
    );
    fs.writeFileSync(htmlPath, htmlContent);
}

console.log('CSS setup completed successfully!'); 