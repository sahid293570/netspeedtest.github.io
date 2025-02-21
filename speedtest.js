class SpeedTest {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.testDuration = {
            download: 10000, // 10 seconds
            upload: 10000    // 10 seconds
        };
        this.maxSpeed = 100;
        this.resizeSpeedometer();
        this.drawSpeedometer(0);
        this.networkProvider = document.getElementById('networkProvider');
        this.connectionType = document.getElementById('connectionType');
        this.networkTypes = {
            '5g_nr': { minSpeed: 150, label: '5G NR' },
            '5g': { minSpeed: 100, label: '5G' },
            '4g_plus': { minSpeed: 50, label: '4G+/LTE-A' },
            '4g': { minSpeed: 10, label: '4G LTE' },
            '3g_plus': { minSpeed: 4, label: '3G+/HSPA+' },
            '3g': { minSpeed: 1, label: '3G' },
            '2g': { minSpeed: 0.1, label: '2G' },
            'edge': { minSpeed: 0.05, label: 'EDGE' },
            'gsm': { minSpeed: 0.01, label: 'GSM' }
        };

        this.testFiles = {
            small: 'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js',
            medium: 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
            large: [
                'https://cdn.jsdelivr.net/npm/three@0.137.0/build/three.min.js',
                'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
                'https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js'
            ]
        };
        this.maxRetries = 3;

        this.currentSpeed = 0;
        this.targetSpeed = 0;
        this.animationFrame = null;
        this.lastMeasurements = [];
        this.maxMeasurements = 10; // Store more measurements for better averaging

        this.pingAttempts = 5; // Number of ping measurements to average
        this.pingTimeout = 2000; // 2 second timeout for ping requests

        // Add resize listener and optimize performance
        let resizeTimeout;
        window.addEventListener('resize', () => {
            // Debounce resize events for better performance
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(() => {
                this.resizeSpeedometer();
                // Get actual network speed using Performance API
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                let speed = 0;
                if (connection) {
                    speed = connection.downlink || 0; // Get real download speed in Mbps
                    speed *= 8; // Convert to Mbps
                }
                // Use a minimum threshold to avoid showing very low speeds
                speed = Math.max(speed, 10);
                this.drawSpeedometer(speed);
            }, 100);
        });
    }

    initializeElements() {
        this.startButton = document.getElementById('startTest');
        this.speedDisplay = document.getElementById('speed');
        this.downloadSpeedDisplay = document.getElementById('downloadSpeed');
        this.uploadSpeedDisplay = document.getElementById('uploadSpeed');
        this.pingDisplay = document.getElementById('ping');
        this.canvas = document.getElementById('speedometer');
        this.ctx = this.canvas.getContext('2d');
        this.progressBar = document.getElementById('progressBar');
        this.testPhase = document.getElementById('testPhase');
    }

    resizeSpeedometer() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, 500); // Set maximum size to 500px
        this.canvas.width = size;
        this.canvas.height = size; // Make it perfectly square
    }

    drawSpeedometer(speed) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.4; // Adjust radius for perfect circle

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background circle
        this.drawCircularBackground(ctx, centerX, centerY, radius);

        // Draw speed arc
        const percentage = Math.min(speed / this.maxSpeed, 1);
        this.drawSpeedArc(ctx, centerX, centerY, radius, percentage);

        // Draw numbers and ticks
        this.drawNumbersAndTicks(ctx, centerX, centerY, radius);

        // Draw needle
        this.drawNeedle(ctx, centerX, centerY, radius, percentage);

        // Draw digital display
        this.drawDigitalDisplay(ctx, centerX, centerY, speed, radius);
    }

    drawCircularBackground(ctx, centerX, centerY, radius) {
        // Draw outer circle with gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.95, centerX, centerY, radius * 1.05);
        gradient.addColorStop(0, '#f0f0f0');
        gradient.addColorStop(1, '#e0e0e0');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.lineWidth = radius * 0.1;
        ctx.strokeStyle = gradient;
        ctx.stroke();
    }

    drawSpeedArc(ctx, centerX, centerY, radius, percentage) {
        const startAngle = Math.PI * 0.75; // Start at -135 degrees
        const endAngle = startAngle + (Math.PI * 1.5 * percentage); // Sweep 270 degrees

        const gradient = ctx.createLinearGradient(
            centerX - radius, centerY - radius,
            centerX + radius, centerY + radius
        );
        gradient.addColorStop(0, this.getSpeedColor(percentage));
        gradient.addColorStop(1, this.getSpeedColorEnd(percentage));

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineWidth = radius * 0.1;
        ctx.lineCap = 'round';
        ctx.strokeStyle = gradient;
        ctx.stroke();
    }

    drawNumbersAndTicks(ctx, centerX, centerY, radius) {
        const totalTicks = 100;
        const majorTicksEvery = 10;
        const startAngle = Math.PI * 0.75;
        const endAngle = Math.PI * 2.25;
        const angleStep = (endAngle - startAngle) / totalTicks;

        ctx.font = `bold ${radius * 0.15}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i <= totalTicks; i++) {
            const angle = startAngle + (i * angleStep);
            const isMajorTick = i % majorTicksEvery === 0;
            
            // Draw tick
            const tickStart = radius * (isMajorTick ? 0.8 : 0.85);
            const tickEnd = radius * 0.95;
            const tickX1 = centerX + Math.cos(angle) * tickStart;
            const tickY1 = centerY + Math.sin(angle) * tickStart;
            const tickX2 = centerX + Math.cos(angle) * tickEnd;
            const tickY2 = centerY + Math.sin(angle) * tickEnd;

            ctx.beginPath();
            ctx.moveTo(tickX1, tickY1);
            ctx.lineTo(tickX2, tickY2);
            ctx.lineWidth = radius * (isMajorTick ? 0.02 : 0.01);
            ctx.strokeStyle = isMajorTick ? '#333' : '#666';
            ctx.stroke();

            // Draw numbers for major ticks
            if (isMajorTick) {
                const number = i / majorTicksEvery * 10;
                const textRadius = radius * 0.7;
                const textX = centerX + Math.cos(angle) * textRadius;
                const textY = centerY + Math.sin(angle) * textRadius;
                
                ctx.fillStyle = '#333';
                ctx.fillText(number.toString(), textX, textY);
            }
        }
    }

    drawNeedle(ctx, centerX, centerY, radius, percentage) {
        const angle = Math.PI * 0.75 + (Math.PI * 1.5 * percentage);
        
        // Draw needle shadow
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw needle
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(angle) * radius * 0.8,
            centerY + Math.sin(angle) * radius * 0.8
        );
        ctx.strokeStyle = '#e53935';
        ctx.lineWidth = radius * 0.03;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Reset shadow
        ctx.shadowColor = 'transparent';

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = '#e53935';
        ctx.fill();
        ctx.strokeStyle = '#b71c1c';
        ctx.lineWidth = radius * 0.02;
        ctx.stroke();
    }

    drawDigitalDisplay(ctx, centerX, centerY, speed, radius) {
        // Draw speed value
        ctx.font = `bold ${radius * 0.3}px Arial`;
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(speed.toFixed(1), centerX, centerY + radius * 0.4);

        // Draw Mbps label
        ctx.font = `${radius * 0.15}px Arial`;
        ctx.fillText('Mbps', centerX, centerY + radius * 0.6);
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.startTest());
    }

    async startTest() {
        try {
            this.startButton.disabled = true;
            this.resetDisplays();
            
            // Update network info before starting the test
            await this.detectNetworkInfo();
            
            this.testPhase.textContent = "Testing Ping...";
            await this.measurePing();
            
            this.testPhase.textContent = "Testing Download Speed...";
            await this.measureDownloadSpeed();
            
            this.testPhase.textContent = "Testing Upload Speed...";
            await this.measureUploadSpeed();
            
            this.testPhase.textContent = "Test Completed";
            
            // Save test results with network info
            this.saveTestResults();
            
        } catch (error) {
            console.error('Test failed:', error);
            this.testPhase.textContent = "Test Failed - Please try again";
        } finally {
            this.startButton.disabled = false;
            this.startButton.textContent = 'Start New Test';
        }
    }

    resetDisplays() {
        this.speedDisplay.textContent = '0.0';
        this.downloadSpeedDisplay.textContent = '0.00 Mbps';
        this.uploadSpeedDisplay.textContent = '0.00 Mbps';
        this.pingDisplay.textContent = '0 ms';
        this.progressBar.style.width = '0%';
        this.startButton.textContent = 'Testing...';
        this.drawSpeedometer(0);
        this.networkProvider.textContent = 'Detecting...';
        this.connectionType.textContent = 'Detecting...';
    }

    async measurePing() {
        try {
            const pingUrls = [
                'https://www.google.com/favicon.ico',
                'https://www.cloudflare.com/favicon.ico',
                'https://www.microsoft.com/favicon.ico'
            ];
            
            let pings = [];
            
            // Perform multiple ping measurements
            for (let i = 0; i < this.pingAttempts; i++) {
                const url = pingUrls[i % pingUrls.length] + '?t=' + Date.now();
                const startTime = performance.now();
                
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.pingTimeout);
                    
                    await fetch(url, {
                        mode: 'no-cors',
                        cache: 'no-store',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    const endTime = performance.now();
                    const pingTime = endTime - startTime;
                    
                    // Only include reasonable ping values (> 1ms and < 1000ms)
                    if (pingTime > 1 && pingTime < 1000) {
                        pings.push(pingTime);
                    }
                } catch (error) {
                    console.warn('Ping attempt failed:', error);
                }
                
                // Small delay between ping attempts
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Calculate average ping, excluding outliers
            if (pings.length > 0) {
                // Sort pings and remove outliers
                pings.sort((a, b) => a - b);
                const validPings = pings.slice(0, Math.ceil(pings.length * 0.8)); // Use best 80%
                
                // Calculate average of valid pings
                const avgPing = validPings.reduce((a, b) => a + b, 0) / validPings.length;
                
                // Round to nearest integer and update display
                const finalPing = Math.round(avgPing);
                this.pingDisplay.textContent = `${finalPing} ms`;
                
                // Update progress
                this.progressBar.style.width = '25%';
            } else {
                this.pingDisplay.textContent = 'Failed';
            }
        } catch (error) {
            console.error('Ping measurement failed:', error);
            this.pingDisplay.textContent = 'Error';
        }
    }

    async measureDownloadSpeed() {
        const startTime = performance.now();
        let bytesLoaded = 0;
        this.lastMeasurements = [];
        
        try {
            const testFiles = [
                'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js',
                'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
                'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js'
            ];
            
            while (performance.now() - startTime < this.testDuration.download) {
                const fileUrl = testFiles[Math.floor(Math.random() * testFiles.length)];
                const response = await fetch(fileUrl + '?t=' + Date.now(), {
                    cache: 'no-store'
                });
                
                const reader = response.body.getReader();
                let lastChunkTime = performance.now();
                
                while (true) {
                    const {done, value} = await reader.read();
                    if (done) break;
                    
                    const currentTime = performance.now();
                    const chunkDuration = (currentTime - lastChunkTime) / 1000;
                    const chunkSpeedMbps = (value.length * 8) / (1024 * 1024 * chunkDuration);
                    
                    this.lastMeasurements.push(chunkSpeedMbps);
                    if (this.lastMeasurements.length > this.maxMeasurements) {
                        this.lastMeasurements.shift();
                    }
                    
                    const avgSpeed = this.calculateAverageSpeed();
                    this.targetSpeed = Math.min(avgSpeed, this.maxSpeed);
                    
                    bytesLoaded += value.length;
                    this.updateSpeedDisplay();
                    this.downloadSpeedDisplay.textContent = `${this.targetSpeed.toFixed(2)} Mbps`;
                    this.progressBar.style.width = `${50 + (currentTime - startTime) / 100}%`;
                    
                    lastChunkTime = currentTime;
                }
            }

            // Store final download speed
            const finalSpeed = this.calculateAverageSpeed();
            this.downloadSpeedDisplay.textContent = `${finalSpeed.toFixed(2)} Mbps`;
        } catch (error) {
            console.error('Download test failed:', error);
        }
    }

    async measureUploadSpeed() {
        const startTime = performance.now();
        let bytesUploaded = 0;
        this.lastMeasurements = [];
        const chunkSize = 256 * 1024; // 256KB chunks

        try {
            while (performance.now() - startTime < this.testDuration.upload) {
                const data = new Blob([new ArrayBuffer(chunkSize)]);
                const chunkStartTime = performance.now();
                
                await fetch('https://httpbin.org/post', {
                    method: 'POST',
                    body: data
                });
                
                const chunkEndTime = performance.now();
                const chunkDuration = (chunkEndTime - chunkStartTime) / 1000;
                const chunkSpeedMbps = (chunkSize * 8) / (1024 * 1024 * chunkDuration);
                
                this.lastMeasurements.push(chunkSpeedMbps);
                if (this.lastMeasurements.length > this.maxMeasurements) {
                    this.lastMeasurements.shift();
                }
                
                const avgSpeed = this.calculateAverageSpeed();
                this.targetSpeed = Math.min(avgSpeed, this.maxSpeed);
                
                bytesUploaded += chunkSize;
                this.updateSpeedDisplay();
                this.uploadSpeedDisplay.textContent = `${this.targetSpeed.toFixed(2)} Mbps`;
                this.progressBar.style.width = `${75 + (chunkEndTime - startTime) / 100}%`;
            }

            // Store final upload speed
            const finalSpeed = this.calculateAverageSpeed();
            this.uploadSpeedDisplay.textContent = `${finalSpeed.toFixed(2)} Mbps`;
        } catch (error) {
            console.error('Upload test failed:', error);
        }
    }

    calculateAverageSpeed() {
        if (this.lastMeasurements.length === 0) return 0;
        
        // Remove outliers
        const sorted = [...this.lastMeasurements].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const validSpeeds = sorted.filter(speed => 
            speed >= q1 - 1.5 * iqr && speed <= q3 + 1.5 * iqr
        );
        
        // Calculate weighted average (recent measurements count more)
        let weightedSum = 0;
        let weightSum = 0;
        validSpeeds.forEach((speed, index) => {
            const weight = index + 1;
            weightedSum += speed * weight;
            weightSum += weight;
        });
        
        return weightedSum / weightSum;
    }

    updateSpeedDisplay() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        const animate = () => {
            // Smooth transition between current and target speed
            const diff = this.targetSpeed - this.currentSpeed;
            const step = diff * 0.1; // 10% of the difference
            
            if (Math.abs(diff) > 0.1) {
                this.currentSpeed += step;
                this.speedDisplay.textContent = this.currentSpeed.toFixed(1);
                this.drawSpeedometer(this.currentSpeed);
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.currentSpeed = this.targetSpeed;
                this.speedDisplay.textContent = this.currentSpeed.toFixed(1);
                this.drawSpeedometer(this.currentSpeed);
            }
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    getSpeedColor(percentage) {
        if (percentage < 0.3) return '#ff4444';
        if (percentage < 0.7) return '#ffbb33';
        return '#00C851';
    }

    getSpeedColorEnd(percentage) {
        if (percentage < 0.3) return '#cc0000';
        if (percentage < 0.7) return '#ff8800';
        return '#007E33';
    }

    async detectNetworkInfo() {
        try {
            // Get connection information
            const connection = navigator.connection || 
                             navigator.mozConnection || 
                             navigator.webkitConnection;
            
            // Get connection info
            const connectionInfo = await this.getDetailedConnectionInfo(connection);
            
            // Get ISP information
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            if (data.org) {
                const ispName = data.org.replace(/^AS\d+\s/, '');
                this.networkProvider.textContent = ispName;
            } else {
                this.networkProvider.textContent = 'Unknown Provider';
            }

            // Update connection type display with fallback logic
            if (connectionInfo.type === 'unknown') {
                // Fallback detection based on speed test
                const speed = await this.quickSpeedTest();
                connectionInfo = this.determineConnectionFromSpeed(speed);
            }

            this.connectionType.textContent = connectionInfo.label;
            this.connectionType.className = `connection-type ${connectionInfo.class}`;

        } catch (error) {
            console.error('Failed to detect network info:', error);
            this.networkProvider.textContent = 'Unknown Provider';
            this.connectionType.textContent = 'Unknown';
        }
    }

    async getDetailedConnectionInfo(connection) {
        let connectionInfo = {
            type: 'unknown',
            label: 'Unknown',
            class: 'unknown',
            details: []
        };

        try {
            // First try: Direct network type detection
            if (connection) {
                const downlink = connection.downlink || 0;
                const rtt = connection.rtt || 0;
                const effectiveType = connection.effectiveType || '';

                // Check for cellular connection
                if (connection.type === 'cellular' || effectiveType) {
                    if (downlink >= 150 || navigator.userAgent.includes('5G')) {
                        return {
                            type: '5g_nr',
                            label: '5G NR',
                            class: 'five-g-nr',
                            details: [`${downlink.toFixed(1)} Mbps`, `${rtt}ms`]
                        };
                    } else if (downlink >= 100) {
                        return {
                            type: '5g',
                            label: '5G',
                            class: 'five-g',
                            details: [`${downlink.toFixed(1)} Mbps`, `${rtt}ms`]
                        };
                    } else if (effectiveType === '4g' || downlink >= 10) {
                        return {
                            type: '4g',
                            label: '4G LTE',
                            class: 'four-g',
                            details: [`${downlink.toFixed(1)} Mbps`, `${rtt}ms`]
                        };
                    } else if (effectiveType === '3g' || downlink >= 1) {
                        return {
                            type: '3g',
                            label: '3G',
                            class: 'three-g',
                            details: [`${downlink.toFixed(1)} Mbps`, `${rtt}ms`]
                        };
                    }
                }
            }

            // Second try: User agent detection
            const ua = navigator.userAgent.toLowerCase();
            if (ua.includes('5g')) {
                return {
                    type: '5g_nr',
                    label: '5G NR',
                    class: 'five-g-nr',
                    details: []
                };
            }

            // Third try: Performance API
            const performance = window.performance;
            if (performance && performance.memory) {
                const speed = await this.quickSpeedTest();
                return this.determineConnectionFromSpeed(speed);
            }

        } catch (error) {
            console.error('Error in connection detection:', error);
        }

        return connectionInfo;
    }

    async quickSpeedTest() {
        try {
            const startTime = performance.now();
            const response = await fetch('https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js' + '?t=' + Date.now(), {
                cache: 'no-store'
            });
            const blob = await response.blob();
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000; // seconds
            const speed = (blob.size * 8) / (1024 * 1024 * duration); // Mbps
            return speed;
        } catch (error) {
            console.error('Quick speed test failed:', error);
            return 0;
        }
    }

    determineConnectionFromSpeed(speed) {
        if (speed >= 150) {
            return {
                type: '5g_nr',
                label: '5G NR',
                class: 'five-g-nr',
                details: [`${speed.toFixed(1)} Mbps`]
            };
        } else if (speed >= 100) {
            return {
                type: '5g',
                label: '5G',
                class: 'five-g',
                details: [`${speed.toFixed(1)} Mbps`]
            };
        } else if (speed >= 50) {
            return {
                type: '4g_plus',
                label: '4G+ LTE-A',
                class: 'four-g-plus',
                details: [`${speed.toFixed(1)} Mbps`]
            };
        } else if (speed >= 10) {
            return {
                type: '4g',
                label: '4G LTE',
                class: 'four-g',
                details: [`${speed.toFixed(1)} Mbps`]
            };
        } else if (speed >= 1) {
            return {
                type: '3g',
                label: '3G',
                class: 'three-g',
                details: [`${speed.toFixed(1)} Mbps`]
            };
        } else {
            return {
                type: '2g',
                label: '2G',
                class: 'two-g',
                details: [`${speed.toFixed(1)} Mbps`]
            };
        }
    }

    updateConnectionDisplay(connectionInfo) {
        const typeElement = document.createElement('span');
        typeElement.className = `connection-badge ${connectionInfo.class}`;
        typeElement.textContent = connectionInfo.label;
        
        this.connectionType.innerHTML = '';
        this.connectionType.appendChild(typeElement);
    }

    saveTestResults() {
        const results = {
            timestamp: new Date().toISOString(),
            provider: this.networkProvider.textContent,
            connectionType: this.connectionType.textContent,
            ping: this.pingDisplay.textContent,
            download: this.downloadSpeedDisplay.textContent,
            upload: this.uploadSpeedDisplay.textContent
        };

        // Save to localStorage
        let savedTests = JSON.parse(localStorage.getItem('speedTests') || '[]');
        savedTests.push(results);
        localStorage.setItem('speedTests', JSON.stringify(savedTests));
    }
}

// Initialize the speed test
new SpeedTest();