document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileToConvert');
    const outputFormatSelect = document.getElementById('outputFormat');
    const convertBtn = document.getElementById('convertBtn');
    const messageDiv = document.getElementById('message');
    const downloadArea = document.getElementById('downloadArea');
    const downloadLink = document.getElementById('downloadLink');

    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`;
        messageDiv.classList.remove('hidden');
    }

    function hideMessage() {
        messageDiv.classList.add('hidden');
    }

    function showDownloadLink(blob, fileName) {
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.textContent = `Download Converted File: ${fileName}`;
        downloadArea.classList.remove('hidden');
    }

    function hideDownloadLink() {
        downloadArea.classList.add('hidden');
        if (downloadLink.href) {
            URL.revokeObjectURL(downloadLink.href); // Clean up the object URL
        }
    }

    convertBtn.addEventListener('click', () => {
        hideMessage();
        hideDownloadLink();

        const file = fileInput.files[0];
        const outputFormat = outputFormatSelect.value;

        if (!file) {
            showMessage('Please select a file.', 'error');
            return;
        }

        if (!outputFormat) {
            showMessage('Please select an output format.', 'error');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const fileContent = e.target.result;
            const originalFileName = file.name;
            const fileNameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
            const originalExtension = originalFileName.substring(originalFileName.lastIndexOf('.') + 1).toLowerCase();

            let convertedContent = null;
            let outputFileName = '';
            let outputMimeType = '';
            let conversionError = false;

            switch (outputFormat) {
                case 'txt_to_html':
                    if (originalExtension !== 'txt') {
                        showMessage('Invalid file type. Expected .txt for TXT to HTML conversion.', 'error');
                        conversionError = true;
                        break;
                    }
                    outputFileName = fileNameWithoutExt + '.html';
                    outputMimeType = 'text/html';
                    // Basic conversion: wrap text in <pre> tags and basic HTML structure
                    convertedContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(fileNameWithoutExt)}</title>
</head>
<body>
    <h1>Converted from ${escapeHtml(originalFileName)}</h1>
    <pre>${escapeHtml(fileContent)}</pre>
</body>
</html>`;
                    break;

                case 'csv_to_json':
                    if (originalExtension !== 'csv') {
                        showMessage('Invalid file type. Expected .csv for CSV to JSON conversion.', 'error');
                        conversionError = true;
                        break;
                    }
                    outputFileName = fileNameWithoutExt + '.json';
                    outputMimeType = 'application/json';
                    try {
                        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
                        if (lines.length === 0) {
                             throw new Error('CSV file is empty or malformed.');
                        }
                        const headers = lines[0].split(',').map(h => h.trim());
                        const data = [];

                        for (let i = 1; i < lines.length; i++) {
                            const values = lines[i].split(',').map(v => v.trim());
                            if (values.length === headers.length) {
                                const rowObject = {};
                                headers.forEach((header, index) => {
                                    rowObject[header] = values[index];
                                });
                                data.push(rowObject);
                            } else {
                                console.warn(`Skipping malformed CSV row ${i + 1}: ${lines[i]}`);
                            }
                        }
                        convertedContent = JSON.stringify(data, null, 2); // Pretty print JSON
                    } catch (e) {
                        showMessage(`CSV to JSON conversion failed: ${e.message}`, 'error');
                        conversionError = true;
                    }
                    break;

                default:
                    showMessage('Unsupported conversion type.', 'error');
                    conversionError = true;
                    break;
            }

            if (!conversionError && convertedContent !== null) {
                const blob = new Blob([convertedContent], { type: outputMimeType });
                showDownloadLink(blob, outputFileName);
                showMessage('File converted successfully!', 'success');
            } else if (!conversionError) {
                // If convertedContent is null but no specific error was set
                showMessage('Conversion failed due to an unknown error.', 'error');
            }
        };

        reader.onerror = () => {
            showMessage('Error reading the file.', 'error');
        };

        // Read the file as text
        reader.readAsText(file);
    });

    // Helper function to escape HTML characters
    function escapeHtml(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
});
