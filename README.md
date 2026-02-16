# 🎯 3D Geometry Visualizer

An interactive web-based tool for visualizing 3D geometric regions, equations, and their intersections in real-time. Perfect for students, educators, and anyone exploring 3D mathematics!

![3D Geometry Visualizer](https://img.shields.io/badge/Math-Visualization-blue)
![Three.js](https://img.shields.io/badge/Three.js-r128-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 🎮 Two Visualization Modes

#### **Basic Mode**
- Define 3D regions using axis conditions (x, y, z)
- Support for inequalities: `≤`, `≥`, `=`
- Slab mode: visualize regions between two values
- Perfect for visualizing:
  - Planes (e.g., x = 3)
  - Half-spaces (e.g., y ≥ 0)
  - Rectangular regions (e.g., -1 ≤ x ≤ 1, -2 ≤ y ≤ 2)
  - Octants and quadrants

#### **Equation Mode**
- Visualize up to 3 equations simultaneously
- Support for:
  - **Spheres**: `x^2 + y^2 + z^2 = 25`
  - **Cylinders**: `x^2 + y^2 = 4`
  - **Paraboloids**: `z = x^2 + y^2`
  - **Planes**: `2*x + 3*y + z = 6`
  - **Complex surfaces**: Any implicit equation
- Each equation rendered in a distinct color
- Find intersections between multiple surfaces
- Dynamic axis scaling based on equation size

### 🎨 Visual Features
- **Color-coded axes**:
  - X-axis: Coral (#ff6b6b)
  - Y-axis: Teal (#4ecdc4)
  - Z-axis: Golden Yellow (#ffe66d)
- **Dark/Light mode** toggle
- **Interactive 3D view**: Drag to rotate, scroll to zoom
- **Camera reset** for quick repositioning
- Smooth point cloud rendering for equations
- Gradient-based surface detection for accurate visualization

### 🛠️ Advanced Features
- **Syntax validation**: Real-time equation checking with helpful error messages
- **Case-insensitive**: Use `X`, `Y`, `Z` or `x`, `y`, `z`
- **Processing indicators**: Visual feedback during computation
- **Dynamic grid**: Subtle in dark mode, clear in light mode
- **Adaptive axis ranges**: Automatically scales to fit your equations
- **5-point axis marking**: Always maintains 5 tick marks regardless of scale

## 🚀 Getting Started

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/3d-geometry-visualizer.git
   cd 3d-geometry-visualizer
   ```

2. Open `index.html` in your web browser

That's it! No build process or dependencies to install. Just open and start visualizing!

### Usage

#### Basic Mode Examples
```
Second Quadrant:
  x ≤ 0, y ≥ 0, z = 0

First Octant:
  x ≥ 0, y ≥ 0, z ≥ 0

Slab Region:
  -1 ≤ x ≤ 1, -2 ≤ y ≤ 2, z = none
```

#### Equation Mode Examples
```
Sphere:
  x^2 + y^2 + z^2 = 9

Cylinder:
  x^2 + y^2 = 4

Paraboloid:
  z = x^2 + y^2

Plane:
  2*x + 3*y + z = 6

Intersection:
  Add multiple equations and click "Show Intersection"
```

### Supported Operations
- **Arithmetic**: `+`, `-`, `*`, `/`, `^`
- **Functions**: `sqrt()`, `sin()`, `cos()`, `abs()`
- **Variables**: `x`, `y`, `z` (case-insensitive)
- **Powers**: Use `^` (e.g., `x^2`, `y^3`)

## 🎯 Controls

| Action | Control |
|--------|---------|
| Rotate view | Click and drag |
| Zoom in/out | Mouse scroll |
| Reset camera | Click 📷 button |
| Toggle theme | Click 🌙/☀️ button |

## 🏗️ Technology Stack

- **Three.js** (r128) - 3D rendering engine
- **Math.js** (11.11.0) - Mathematical expression parsing
- **Vanilla JavaScript** - No framework dependencies
- **Pure CSS3** - Modern, responsive design

## 📁 Project Structure

```
3d-geometry-visualizer/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── script.js           # Core visualization logic
├── favicon.ico         # Website icon
└── README.md          # Documentation
```

## 🎓 Educational Use Cases

- **Calculus III**: Visualize regions of integration
- **Linear Algebra**: Understand planes and intersections
- **Multivariable Calculus**: Explore 3D surfaces
- **Geometry**: Study quadrants, octants, and geometric shapes
- **Engineering**: Visualize spatial constraints

## 🐛 Known Limitations

- Maximum 3 equations in equation mode (to maintain performance)
- Resolution limited to 80x80x80 grid for smooth performance
- Browser must support WebGL for 3D rendering
- Very large equation coefficients (>100) may affect visualization scale

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 License

This project is licensed under the MIT License - feel free to use it for educational or commercial purposes.

## 👨‍💻 Author

**Arham Yunus Awan**

## 🙏 Acknowledgments

- Built with [Three.js](https://threejs.org/)
- Mathematical parsing by [Math.js](https://mathjs.org/)
- Inspired by the need for better 3D math visualization tools

## 📸 Screenshots

### Dark Mode
*Interactive 3D visualization with dark theme for comfortable viewing*

### Light Mode
*Clean light theme for presentations and printing*

### Equation Visualization
*Multiple surfaces with distinct colors and intersection finding*

---

**Happy Visualizing! 🎉**

If you find this tool helpful, please give it a ⭐ on GitHub!
