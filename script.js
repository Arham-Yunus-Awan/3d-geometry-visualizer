let scene, camera, renderer;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotation = { x: -0.4, y: 0.6 };
let visualizedObjects = [];
let currentMode = 'basic';
let equations = [];
let nextEquationId = 1;
const MAX_EQUATIONS = 3;
const EQUATION_COLORS = ['#ef4444', '#22d3ee', '#a78bfa'];
let isDarkMode = true;

// Dynamic axis scaling
let axisRange = { min: -5, max: 5 };
let axisLabels = [];
let gridHelper = null;

// Initial camera position
const INITIAL_CAMERA_POS = { x: 10, y: 8, z: 10 };
const INITIAL_ROTATION = { x: -0.4, y: 0.6 };

// Dark Mode Toggle
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    const body = document.body;
    const themeBtn = document.getElementById('theme-btn');
    
    if (isDarkMode) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeBtn.textContent = '🌙';
        scene.background = new THREE.Color(0x0f172a);
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeBtn.textContent = '☀️';
        scene.background = new THREE.Color(0xf7fafc);
    }
    
    // Recreate grid with new colors
    updateAxes();
}

// Reset Camera
function resetCamera() {
    camera.position.set(INITIAL_CAMERA_POS.x, INITIAL_CAMERA_POS.y, INITIAL_CAMERA_POS.z);
    rotation.x = INITIAL_ROTATION.x;
    rotation.y = INITIAL_ROTATION.y;
    camera.lookAt(0, 0, 0);
}

// Mode Switching
function switchMode(mode) {
    currentMode = mode;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update content
    document.querySelectorAll('.mode-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(mode + '-mode').classList.add('active');
    
    // Clear visualization when switching modes
    clearVisualization();
    
    // Initialize equation mode if switching to it
    if (mode === 'equation' && equations.length === 0) {
        addEquation();
    }
}

// Equation Management
function addEquation() {
    if (equations.length >= MAX_EQUATIONS) return;
    
    // Find the first available color index
    const usedColorIndices = equations.map(eq => eq.colorIndex);
    let colorIndex = 0;
    for (let i = 0; i < EQUATION_COLORS.length; i++) {
        if (!usedColorIndices.includes(i)) {
            colorIndex = i;
            break;
        }
    }
    
    const eqId = nextEquationId++;
    const displayNumber = equations.length + 1;
    const color = EQUATION_COLORS[colorIndex];
    
    equations.push({ id: eqId, color: color, colorIndex: colorIndex, displayNumber: displayNumber });
    
    const equationHTML = `
        <div class="equation-item" id="equation-${eqId}" data-color-index="${colorIndex}">
            <div class="equation-header">
                <div class="equation-label">
                    <span class="color-indicator" style="background: ${color};"></span>
                    <span class="eq-number">Equation ${displayNumber}</span>
                </div>
                <button class="remove-equation-btn" onclick="removeEquation(${eqId})">✕ Remove</button>
            </div>
            <div class="equation-input-wrapper">
                <input type="text" 
                       class="equation-input" 
                       id="eq-input-${eqId}" 
                       placeholder="e.g., x^2 + y^2 + z^2 = 9"
                       oninput="updateIntersectionButton()">
                <div class="equation-input-help">
                    Use ^ for power (x^2), * for multiply, / for divide
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('equations-container').insertAdjacentHTML('beforeend', equationHTML);
    
    if (equations.length >= MAX_EQUATIONS) {
        document.getElementById('add-eq-btn').disabled = true;
        document.getElementById('add-eq-btn').textContent = '✓ Max 3 Equations';
    }
    
    updateIntersectionButton();
}

function removeEquation(id) {
    const element = document.getElementById(`equation-${id}`);
    if (element) {
        element.remove();
        equations = equations.filter(eq => eq.id !== id);
        renumberEquations();
        
        document.getElementById('add-eq-btn').disabled = false;
        document.getElementById('add-eq-btn').textContent = '➕ Add Equation';
        
        updateIntersectionButton();
    }
}

function renumberEquations() {
    equations.forEach((eq, index) => {
        eq.displayNumber = index + 1;
        const element = document.getElementById(`equation-${eq.id}`);
        if (element) {
            const numberSpan = element.querySelector('.eq-number');
            if (numberSpan) {
                numberSpan.textContent = `Equation ${eq.displayNumber}`;
            }
        }
    });
}

function updateIntersectionButton() {
    const hasMultipleEquations = equations.length > 1;
    const intersectionBtn = document.getElementById('intersection-btn');
    intersectionBtn.style.display = hasMultipleEquations ? 'block' : 'none';
}

function validateEquationSyntax(equation) {
    // Check for basic syntax errors
    const errors = [];
    
    // Check for empty equation
    if (!equation || equation.trim() === '') {
        return { valid: false, error: 'Equation cannot be empty' };
    }
    
    // Convert uppercase X, Y, Z to lowercase for processing
    equation = equation.replace(/X/g, 'x').replace(/Y/g, 'y').replace(/Z/g, 'z');
    
    // Check if equation has an equals sign with empty sides
    if (equation.includes('=')) {
        const [left, right] = equation.split('=');
        if (!left || left.trim() === '') {
            return { valid: false, error: 'Left side of equation cannot be empty' };
        }
        if (!right || right.trim() === '') {
            return { valid: false, error: 'Right side of equation cannot be empty' };
        }
    }
    
    // Check for balanced parentheses
    let parenCount = 0;
    for (let char of equation) {
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
        if (parenCount < 0) {
            return { valid: false, error: 'Unbalanced parentheses - closing ) before opening (' };
        }
    }
    if (parenCount > 0) {
        return { valid: false, error: 'Unbalanced parentheses - missing closing )' };
    }
    if (parenCount < 0) {
        return { valid: false, error: 'Unbalanced parentheses - missing opening (' };
    }
    
    // Check for invalid characters (allow letters, numbers, operators, parentheses, and spaces)
    const validPattern = /^[a-zA-Z0-9+\-*/^()=.,\s]*$/;
    if (!validPattern.test(equation)) {
        return { valid: false, error: 'Invalid characters in equation. Use only: x, y, z, numbers, +, -, *, /, ^, (, )' };
    }
    
    // Check for consecutive operators
    if (/[+\-*/^]{2,}/.test(equation.replace('**', ''))) {
        return { valid: false, error: 'Consecutive operators found (e.g., ++, --, */). Use single operators.' };
    }
    
    // Check for operators at start or end
    if (/^[*/^]/.test(equation.trim())) {
        return { valid: false, error: 'Equation cannot start with *, /, or ^' };
    }
    if (/[+\-*/^]$/.test(equation.trim())) {
        return { valid: false, error: 'Equation cannot end with an operator' };
    }
    
    // Check for operators right before or after equals sign
    if (/[+\-*/^]\s*=$/.test(equation) || /=\s*[+\-*/^]/.test(equation)) {
        return { valid: false, error: 'Cannot have operators immediately before or after =' };
    }
    
    // Test if math.js can parse it
    try {
        const testScope = { x: 1, y: 1, z: 1 };
        if (equation.includes('=')) {
            const [left, right] = equation.split('=');
            math.evaluate(left.trim(), testScope);
            math.evaluate(right.trim(), testScope);
        } else {
            math.evaluate(equation, testScope);
        }
        return { valid: true, normalizedEquation: equation };
    } catch (e) {
        return { valid: false, error: 'Syntax error: ' + e.message };
    }
}

function toggleSlab(axis) {
    const checkbox = document.getElementById(`${axis}-slab`);
    const singleContainer = document.getElementById(`${axis}-single`);
    const slabContainer = document.getElementById(`${axis}-slab-container`);
    
    if (checkbox.checked) {
        singleContainer.style.display = 'none';
        slabContainer.classList.add('active');
    } else {
        singleContainer.style.display = 'block';
        slabContainer.classList.remove('active');
    }
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(INITIAL_CAMERA_POS.x, INITIAL_CAMERA_POS.y, INITIAL_CAMERA_POS.z);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    updateAxes();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    window.addEventListener('resize', onWindowResize);

    animate();
}

function calculateAxisRange(equations) {
    // Parse equations and estimate range
    let maxValue = 5;
    
    equations.forEach(eq => {
        const input = document.getElementById(`eq-input-${eq.id}`);
        if (!input) return;
        
        const equation = input.value.trim();
        if (!equation) return;
        
        // Extract numbers from equation
        const numbers = equation.match(/\d+\.?\d*/g);
        if (numbers) {
            numbers.forEach(num => {
                const val = parseFloat(num);
                if (val > maxValue) {
                    maxValue = val;
                }
            });
        }
    });
    
    // Round up to nice number
    if (maxValue <= 5) return { min: -5, max: 5 };
    if (maxValue <= 10) return { min: -10, max: 10 };
    if (maxValue <= 20) return { min: -20, max: 20 };
    if (maxValue <= 50) return { min: -50, max: 50 };
    return { min: -100, max: 100 };
}

function updateAxes() {
    // Remove old axes and labels
    axisLabels.forEach(label => scene.remove(label));
    axisLabels = [];
    
    // Remove old grid with proper disposal
    if (gridHelper) {
        scene.remove(gridHelper);
        if (gridHelper.geometry) gridHelper.geometry.dispose();
        if (gridHelper.material) gridHelper.material.dispose();
        gridHelper = null;
    }
    
    const range = axisRange.max;
    const axisLength = range * 1.2;
    const axisRadius = 0.03; // Thickness of axis lines
    
    // Universal color scheme that works in both light and dark modes
    const xColor = 0xff6b6b; // Coral/Salmon - warm but not too bright
    const yColor = 0x4ecdc4; // Teal - distinct from cyan equations
    const zColor = 0xffe66d; // Golden Yellow - warm accent
    
    // Create X axis - CORAL (thick cylinder)
    const xGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength * 2, 8);
    const xMaterial = new THREE.MeshBasicMaterial({ color: xColor });
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.rotation.z = Math.PI / 2;
    scene.add(xAxis);
    axisLabels.push(xAxis);

    // Create Y axis - TEAL (thick cylinder)
    const yGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength * 2, 8);
    const yMaterial = new THREE.MeshBasicMaterial({ color: yColor });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    yAxis.rotation.x = Math.PI / 2;
    scene.add(yAxis);
    axisLabels.push(yAxis);

    // Create Z axis - GOLDEN YELLOW (thick cylinder)
    const zGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength * 2, 8);
    const zMaterial = new THREE.MeshBasicMaterial({ color: zColor });
    const zAxis = new THREE.Mesh(zGeometry, zMaterial);
    scene.add(zAxis);
    axisLabels.push(zAxis);

    // Add arrow heads with matching colors
    addArrowHead(new THREE.Vector3(axisLength, 0, 0), 0xff6b6b, new THREE.Vector3(1, 0, 0)); // Coral
    addArrowHead(new THREE.Vector3(0, 0, axisLength), 0x4ecdc4, new THREE.Vector3(0, 0, 1)); // Teal
    addArrowHead(new THREE.Vector3(0, axisLength, 0), 0xffe66d, new THREE.Vector3(0, 1, 0)); // Golden Yellow
    
    // Create grid
    createNumberedGrid();
    
    // Add axis labels
    addAxisLabels();
}

function addArrowHead(position, color, direction) {
    const geometry = new THREE.ConeGeometry(0.15, 0.4, 8);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const cone = new THREE.Mesh(geometry, material);
    cone.position.copy(position);
    
    if (direction.x !== 0) {
        cone.rotation.z = direction.x > 0 ? -Math.PI / 2 : Math.PI / 2;
    } else if (direction.y !== 0) {
        cone.rotation.x = direction.y > 0 ? 0 : Math.PI;
    } else if (direction.z !== 0) {
        cone.rotation.x = Math.PI / 2;
        cone.rotation.z = direction.z > 0 ? 0 : Math.PI;
    }
    
    scene.add(cone);
    axisLabels.push(cone);
}

function createNumberedGrid() {
    const range = axisRange.max;
    const gridSize = range * 2.4;
    const gridDivisions = 24;
    
    // Create grid with subtle colors based on theme
    const gridColor = isDarkMode ? 0x1e293b : 0xeeeeee;
    const gridCenterColor = isDarkMode ? 0x334155 : 0xcccccc;
    
    gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridCenterColor, gridColor);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    // Create 5 tick marks on each axis (always 5 marks regardless of range)
    const step = range / 2.5;
    const positions = [];
    for (let i = -2; i <= 2; i++) {
        if (i !== 0) {
            positions.push(Math.round(i * step * 10) / 10);
        }
    }

    positions.forEach(val => {
        // X axis - Coral
        createNumberLabel(val.toString(), new THREE.Vector3(val, 0, -range * 0.08), '#ff6b6b', 0.3);
        const xTick = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, range * 0.06),
            new THREE.MeshBasicMaterial({ color: 0xff6b6b })
        );
        xTick.position.set(val, 0, 0);
        scene.add(xTick);
        axisLabels.push(xTick);

        // Y axis - Teal
        createNumberLabel(val.toString(), new THREE.Vector3(-range * 0.08, 0, val), '#4ecdc4', 0.3);
        const yTick = new THREE.Mesh(
            new THREE.BoxGeometry(range * 0.06, 0.05, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x4ecdc4 })
        );
        yTick.position.set(0, 0, val);
        scene.add(yTick);
        axisLabels.push(yTick);

        // Z axis - Golden Yellow
        createNumberLabel(val.toString(), new THREE.Vector3(-range * 0.08, val, 0), '#ffe66d', 0.3);
        const zTick = new THREE.Mesh(
            new THREE.BoxGeometry(range * 0.06, 0.05, 0.05),
            new THREE.MeshBasicMaterial({ color: 0xffe66d })
        );
        zTick.position.set(0, val, 0);
        scene.add(zTick);
        axisLabels.push(zTick);
    });

    // Origin
    const origin = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    scene.add(origin);
    axisLabels.push(origin);
    createNumberLabel('0', new THREE.Vector3(0.3, 0, 0.3), '#fbbf24', 0.4);
}

function createNumberLabel(text, position, color, size = 0.3) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    
    context.fillStyle = color;
    context.font = 'Bold 80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(size, size, 1);
    scene.add(sprite);
    axisLabels.push(sprite);
}

function addAxisLabels() {
    const range = axisRange.max;
    const labelOffset = range * 1.3;
    
    function createLabel(text, position, color, size = 1) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;
        
        context.fillStyle = color;
        context.font = 'Bold 150px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(size, size, 1);
        scene.add(sprite);
        axisLabels.push(sprite);
    }

    createLabel('X', new THREE.Vector3(labelOffset, 0, 0), '#ff6b6b', 1.2);
    createLabel('Y', new THREE.Vector3(0, 0, labelOffset), '#4ecdc4', 1.2);
    createLabel('Z', new THREE.Vector3(0, labelOffset, 0), '#ffe66d', 1.2);
}

function getAxisCondition(axis) {
    const isSlab = document.getElementById(`${axis}-slab`).checked;
    
    if (isSlab) {
        const min = parseFloat(document.getElementById(`${axis}-min`).value);
        const max = parseFloat(document.getElementById(`${axis}-max`).value);
        if (!isNaN(min) && !isNaN(max)) {
            return { type: 'slab', min: min, max: max };
        }
    } else {
        const op = document.getElementById(`${axis}-operator`).value;
        const val = parseFloat(document.getElementById(`${axis}-value`).value);
        if (op !== 'none' && !isNaN(val)) {
            return { type: 'single', operator: op, value: val };
        }
    }
    
    return { type: 'none' };
}

function visualizeRegion() {
    const xCond = getAxisCondition('x');
    const yCond = getAxisCondition('y');
    const zCond = getAxisCondition('z');

    if (xCond.type === 'none' && yCond.type === 'none' && zCond.type === 'none') {
        alert('Please set at least one condition!');
        return;
    }

    // Add processing spinner
    const button = event.target;
    button.classList.add('processing');
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
        clearVisualization();

        let xMin = axisRange.min, xMax = axisRange.max;
        let yMin = axisRange.min, yMax = axisRange.max;
        let zMin = axisRange.min, zMax = axisRange.max;

        if (xCond.type === 'slab') {
            xMin = xCond.min;
            xMax = xCond.max;
        } else if (xCond.type === 'single') {
            if (xCond.operator === '=') {
                xMin = xMax = xCond.value;
            } else if (xCond.operator === '<=') {
                xMax = xCond.value;
            } else if (xCond.operator === '>=') {
                xMin = xCond.value;
            }
        }

        if (yCond.type === 'slab') {
            yMin = yCond.min;
            yMax = yCond.max;
        } else if (yCond.type === 'single') {
            if (yCond.operator === '=') {
                yMin = yMax = yCond.value;
            } else if (yCond.operator === '<=') {
                yMax = yCond.value;
            } else if (yCond.operator === '>=') {
                yMin = yCond.value;
            }
        }

        if (zCond.type === 'slab') {
            zMin = zCond.min;
            zMax = zCond.max;
        } else if (zCond.type === 'single') {
            if (zCond.operator === '=') {
                zMin = zMax = zCond.value;
            } else if (zCond.operator === '<=') {
                zMax = zCond.value;
            } else if (zCond.operator === '>=') {
                zMin = zCond.value;
            }
        }

        drawRegion(xMin, xMax, yMin, yMax, zMin, zMax);
        
        // Remove processing spinner
        button.classList.remove('processing');
    }, 50);
}

function visualizeEquations() {
    if (equations.length === 0) {
        alert('Please add at least one equation!');
        return;
    }
    
    // Validate all equations first
    for (let eq of equations) {
        const input = document.getElementById(`eq-input-${eq.id}`);
        const equation = input.value.trim();
        
        if (equation) {
            const validation = validateEquationSyntax(equation);
            if (!validation.valid) {
                alert(`Error in Equation ${eq.displayNumber}: ${validation.error}`);
                return;
            }
        }
    }
    
    // Add processing spinner
    const button = event.target;
    button.classList.add('processing');
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
        clearVisualization();
        
        // Calculate appropriate axis range
        axisRange = calculateAxisRange(equations);
        updateAxes();
        
        equations.forEach(eq => {
            const input = document.getElementById(`eq-input-${eq.id}`);
            const equation = input.value.trim();
            
            if (equation) {
                visualizeSingleEquation(equation, eq.color);
            }
        });
        
        // Remove processing spinner
        button.classList.remove('processing');
    }, 50);
}

function visualizeSingleEquation(equation, color) {
    try {
        // Normalize uppercase X, Y, Z to lowercase
        equation = equation.replace(/X/g, 'x').replace(/Y/g, 'y').replace(/Z/g, 'z');
        
        let leftSide, rightSide;
        if (equation.includes('=')) {
            [leftSide, rightSide] = equation.split('=').map(s => s.trim());
        } else {
            leftSide = equation;
            rightSide = '0';
        }
        
        const implicitFunc = (x, y, z) => {
            try {
                const scope = { x, y, z };
                const left = math.evaluate(leftSide, scope);
                const right = math.evaluate(rightSide, scope);
                return left - right;
            } catch (e) {
                return NaN;
            }
        };
        
        drawImplicitSurfaceImproved(implicitFunc, color);
        
    } catch (error) {
        console.error('Error visualizing equation:', error);
        alert('Error in equation: ' + error.message);
    }
}

function drawImplicitSurfaceImproved(func, colorHex) {
    const range = axisRange.max;
    const resolution = 80; // Higher resolution for smoother surfaces
    const step = (2 * range) / resolution;
    
    // Adaptive threshold based on range
    const threshold = Math.max(0.1, range * 0.02);
    
    const color = new THREE.Color(colorHex);
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    // Use marching cubes-like approach for smoother surfaces
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            for (let k = 0; k < resolution; k++) {
                const x = -range + i * step;
                const y = -range + j * step;
                const z = -range + k * step;
                
                const value = func(x, y, z);
                
                if (Math.abs(value) < threshold) {
                    // Calculate gradient for surface normal (better filtering)
                    const epsilon = step * 0.5;
                    const dx = func(x + epsilon, y, z) - func(x - epsilon, y, z);
                    const dy = func(x, y + epsilon, z) - func(x, y - epsilon, z);
                    const dz = func(x, y, z + epsilon) - func(x, y, z - epsilon);
                    
                    const gradLength = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    
                    // Only add points near the actual surface (where gradient is significant)
                    if (gradLength > 0.01) {
                        positions.push(x, z, y); // Note: z and y swapped for Three.js coordinates
                        colors.push(color.r, color.g, color.b);
                    }
                }
            }
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        sizeAttenuation: true
    });
    
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    visualizedObjects.push(points);
}

function visualizeIntersection() {
    if (equations.length < 2) {
        alert('Need at least 2 equations for intersection!');
        return;
    }
    
    const equationData = [];
    equations.forEach(eq => {
        const input = document.getElementById(`eq-input-${eq.id}`);
        const equation = input.value.trim();
        if (equation) {
            // Validate syntax
            const validation = validateEquationSyntax(equation);
            if (!validation.valid) {
                alert(`Error in Equation ${eq.displayNumber}: ${validation.error}`);
                throw new Error('Validation failed');
            }
            equationData.push(equation);
        }
    });
    
    if (equationData.length < 2) {
        alert('Need at least 2 valid equations!');
        return;
    }
    
    // Add processing spinner
    const button = event.target;
    button.classList.add('processing');
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
        try {
            clearVisualization();
            
            // Calculate appropriate axis range
            axisRange = calculateAxisRange(equations);
            updateAxes();
            
            const funcs = equationData.map(eq => {
                // Normalize uppercase X, Y, Z to lowercase
                eq = eq.replace(/X/g, 'x').replace(/Y/g, 'y').replace(/Z/g, 'z');
                
                let leftSide, rightSide;
                if (eq.includes('=')) {
                    [leftSide, rightSide] = eq.split('=').map(s => s.trim());
                } else {
                    leftSide = eq;
                    rightSide = '0';
                }
                
                return (x, y, z) => {
                    try {
                        const scope = { x, y, z };
                        const left = math.evaluate(leftSide, scope);
                        const right = math.evaluate(rightSide, scope);
                        return left - right;
                    } catch (e) {
                        return NaN;
                    }
                };
            });
            
            const range = axisRange.max;
            const resolution = 70;
            const step = (2 * range) / resolution;
            const threshold = Math.max(0.12, range * 0.025);
            
            const geometry = new THREE.BufferGeometry();
            const positions = [];
            
            for (let i = 0; i < resolution; i++) {
                for (let j = 0; j < resolution; j++) {
                    for (let k = 0; k < resolution; k++) {
                        const x = -range + i * step;
                        const y = -range + j * step;
                        const z = -range + k * step;
                        
                        // Check if ALL equations are satisfied (intersection)
                        // This is the correct logic: ALL functions must be close to zero
                        const allSatisfied = funcs.every(func => {
                            const val = func(x, y, z);
                            return !isNaN(val) && Math.abs(val) < threshold;
                        });
                        
                        if (allSatisfied) {
                            positions.push(x, z, y);
                        }
                    }
                }
            }
            
            if (positions.length === 0) {
                alert('No intersection found in the visible range! Try adjusting the equations or the viewing range.');
                button.classList.remove('processing');
                return;
            }
            
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            
            const material = new THREE.PointsMaterial({
                size: 0.15,
                color: 0x9333ea,
                sizeAttenuation: true
            });
            
            const points = new THREE.Points(geometry, material);
            scene.add(points);
            visualizedObjects.push(points);
            
        } catch (error) {
            if (error.message !== 'Validation failed') {
                console.error('Error finding intersection:', error);
                alert('Error finding intersection: ' + error.message);
            }
        } finally {
            // Remove processing spinner
            button.classList.remove('processing');
        }
    }, 50);
}

function drawRegion(xMin, xMax, yMin, yMax, zMin, zMax) {
    const xSize = xMax - xMin;
    const ySize = yMax - yMin;
    const zSize = zMax - zMin;
    const xCenter = (xMax + xMin) / 2;
    const yCenter = (yMax + yMin) / 2;
    const zCenter = (zMax + zMin) / 2;

    const xFixed = xSize < 0.01;
    const yFixed = ySize < 0.01;
    const zFixed = zSize < 0.01;

    if (xFixed && yFixed && zFixed) {
        const point = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xe53e3e })
        );
        point.position.set(xCenter, zCenter, yCenter);
        scene.add(point);
        visualizedObjects.push(point);
    } else if ((xFixed && yFixed) || (xFixed && zFixed) || (yFixed && zFixed)) {
        drawLine(xMin, xMax, yMin, yMax, zMin, zMax, xFixed, yFixed, zFixed);
    } else if (xFixed || yFixed || zFixed) {
        draw2DRegion(xMin, xMax, yMin, yMax, zMin, zMax, xFixed, yFixed, zFixed);
    } else {
        draw3DVolume(xMin, xMax, yMin, yMax, zMin, zMax);
    }
}

function drawLine(xMin, xMax, yMin, yMax, zMin, zMax, xFixed, yFixed, zFixed) {
    const points = [];
    const size = 10;

    if (!xFixed) {
        points.push(new THREE.Vector3(xMin, zFixed ? zMin : -size/2, yFixed ? yMin : -size/2));
        points.push(new THREE.Vector3(xMax, zFixed ? zMax : size/2, yFixed ? yMax : size/2));
    } else if (!yFixed) {
        points.push(new THREE.Vector3(xFixed ? xMin : -size/2, zFixed ? zMin : -size/2, yMin));
        points.push(new THREE.Vector3(xFixed ? xMax : size/2, zFixed ? zMax : size/2, yMax));
    } else {
        points.push(new THREE.Vector3(xFixed ? xMin : -size/2, zMin, yFixed ? yMin : -size/2));
        points.push(new THREE.Vector3(xFixed ? xMax : size/2, zMax, yFixed ? yMax : size/2));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xe53e3e, linewidth: 3 });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    visualizedObjects.push(line);

    const start = points[0];
    const end = points[1];
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const length = start.distanceTo(end);

    for (let t = 0; t <= length; t += 0.5) {
        const pos = new THREE.Vector3().addVectors(start, direction.clone().multiplyScalar(t));
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xe53e3e })
        );
        sphere.position.copy(pos);
        scene.add(sphere);
        visualizedObjects.push(sphere);
    }
}

function draw2DRegion(xMin, xMax, yMin, yMax, zMin, zMax, xFixed, yFixed, zFixed) {
    const xSize = xMax - xMin;
    const ySize = yMax - yMin;
    const zSize = zMax - zMin;
    const xCenter = (xMax + xMin) / 2;
    const yCenter = (yMax + yMin) / 2;
    const zCenter = (zMax + zMin) / 2;

    let geometry, plane;

    if (zFixed) {
        geometry = new THREE.PlaneGeometry(xSize, ySize);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4299e1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        plane = new THREE.Mesh(geometry, material);
        plane.position.set(xCenter, zCenter, yCenter);
        plane.rotation.x = Math.PI / 2;

        const borderPoints = [
            new THREE.Vector3(xMin, zCenter, yMin),
            new THREE.Vector3(xMax, zCenter, yMin),
            new THREE.Vector3(xMax, zCenter, yMax),
            new THREE.Vector3(xMin, zCenter, yMax),
            new THREE.Vector3(xMin, zCenter, yMin)
        ];
        const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x1e40af, linewidth: 3 });
        const border = new THREE.Line(borderGeometry, borderMaterial);
        scene.add(border);
        visualizedObjects.push(border);
    } else if (xFixed) {
        geometry = new THREE.PlaneGeometry(ySize, zSize);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4299e1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        plane = new THREE.Mesh(geometry, material);
        plane.position.set(xCenter, zCenter, yCenter);
        plane.rotation.y = Math.PI / 2;

        const borderGeometry = new THREE.EdgesGeometry(geometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x1e40af, linewidth: 3 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        border.position.copy(plane.position);
        border.rotation.copy(plane.rotation);
        scene.add(border);
        visualizedObjects.push(border);
    } else if (yFixed) {
        geometry = new THREE.PlaneGeometry(xSize, zSize);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4299e1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        plane = new THREE.Mesh(geometry, material);
        plane.position.set(xCenter, zCenter, yCenter);

        const borderGeometry = new THREE.EdgesGeometry(geometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x1e40af, linewidth: 3 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        border.position.copy(plane.position);
        border.rotation.copy(plane.rotation);
        scene.add(border);
        visualizedObjects.push(border);
    }

    scene.add(plane);
    visualizedObjects.push(plane);
}

function draw3DVolume(xMin, xMax, yMin, yMax, zMin, zMax) {
    const xSize = xMax - xMin;
    const ySize = yMax - yMin;
    const zSize = zMax - zMin;
    const xCenter = (xMax + xMin) / 2;
    const yCenter = (yMax + yMin) / 2;
    const zCenter = (zMax + zMin) / 2;

    const geometry = new THREE.BoxGeometry(xSize, zSize, ySize);
    const material = new THREE.MeshBasicMaterial({
        color: 0x4299e1,
        transparent: true,
        opacity: 0.4
    });
    const box = new THREE.Mesh(geometry, material);
    box.position.set(xCenter, zCenter, yCenter);
    scene.add(box);
    visualizedObjects.push(box);

    const wireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0x1e40af, linewidth: 2 })
    );
    wireframe.position.copy(box.position);
    scene.add(wireframe);
    visualizedObjects.push(wireframe);
}

function clearVisualization() {
    visualizedObjects.forEach(obj => {
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
    visualizedObjects = [];
}

function resetInputs() {
    ['x', 'y', 'z'].forEach(axis => {
        document.getElementById(`${axis}-operator`).value = 'none';
        document.getElementById(`${axis}-value`).value = '';
        document.getElementById(`${axis}-min`).value = '';
        document.getElementById(`${axis}-max`).value = '';
        document.getElementById(`${axis}-slab`).checked = false;
        toggleSlab(axis);
    });
}

function clearAll() {
    clearVisualization();
    if (currentMode === 'basic') {
        resetInputs();
    } else {
        document.querySelectorAll('.equation-input').forEach(input => {
            input.value = '';
        });
    }
    // Reset axis range
    axisRange = { min: -5, max: 5 };
    updateAxes();
}

function onMouseDown(event) {
    if (event.target.tagName !== 'CANVAS') return;
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onMouseMove(event) {
    if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        rotation.y += deltaX * 0.005;
        rotation.x += deltaY * 0.005;

        rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotation.x));

        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
}

function onMouseUp() {
    isDragging = false;
}

function onWheel(event) {
    event.preventDefault();
    const zoomSpeed = 0.001;
    const distance = camera.position.length();
    const newDistance = distance * (1 + event.deltaY * zoomSpeed);
    camera.position.multiplyScalar(newDistance / distance);
    camera.position.clampLength(4, 30);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const radius = camera.position.length();
    camera.position.x = radius * Math.sin(rotation.y) * Math.cos(rotation.x);
    camera.position.y = radius * Math.sin(rotation.x);
    camera.position.z = radius * Math.cos(rotation.y) * Math.cos(rotation.x);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

init();