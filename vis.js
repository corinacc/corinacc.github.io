// Helper function to create SVG elements with the correct namespace
function createSVG(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

// 1. STATISTICAL VISUALIZATION (Simple & Static)

const visContainer = document.getElementById('vis-container');

// Helper to create SVG elements
const ns = "http://www.w3.org/2000/svg";
const svgVis = document.createElementNS(ns, "svg");

// Set up the box
svgVis.setAttribute("width", "100%");
svgVis.setAttribute("height", "250");
svgVis.setAttribute("viewBox", "0 0 400 200");
svgVis.style.border = "1px solid #ddd"; // Optional border
svgVis.style.borderRadius = "8px";

// --- Calculate the Bell Curve Points ---
let points = [];
const width = 400;
const height = 200;
const mean = width / 2;    // Center (200)
const sigma = 45;          // Spread (Standard Deviation)

// Loop across the width of the SVG
for (let x = 0; x <= width; x += 5) {
    // The Math: Gaussian Function
    const exponent = -0.5 * Math.pow((x - mean) / sigma, 2);
    const y = height - (Math.exp(exponent) * 150); // 150 is the height of the peak
    points.push(`${x},${y}`);
}

// Close the shape at the bottom for the fill
const fillPoints = [...points, `${width},${height}`, `0,${height}`].join(" ");
const linePoints = points.join(" ");

// --- Draw the Fill (Light Blue Area) ---
const area = document.createElementNS(ns, "polygon");
area.setAttribute("points", fillPoints);
area.setAttribute("fill", "rgba(0, 122, 255, 0.15)"); // Light Blue
svgVis.appendChild(area);

// --- Draw the Line (Dark Blue Curve) ---
const line = document.createElementNS(ns, "polyline");
line.setAttribute("points", linePoints);
line.setAttribute("fill", "none");
line.setAttribute("stroke", "#007AFF"); // SFU Blue
line.setAttribute("stroke-width", "3");
line.setAttribute("stroke-linecap", "round");
line.setAttribute("stroke-linejoin", "round");
svgVis.appendChild(line);

// Add to page
visContainer.appendChild(svgVis);

// 2. CREATIVE SVG ART: "SFU" Circle
const artContainer = document.getElementById('art-container');
const svgArt = createSVG("svg");
svgArt.setAttribute("width", "100%");
svgArt.setAttribute("height", "250");
svgArt.setAttribute("viewBox", "0 0 430 250");
svgArt.style.background = "#111";

// Grid coordinates for S, F, and U
const sPoints = [[50,50], [80,50], [110,50], [50,80], [50,110], [80,110], [110,110], [110,140], [110,170], [80,170], [50,170]];
const fPoints = [[180,50], [210,50], [240,50], [180,80], [180,110], [210,110], [180,140], [180,170]];
const uPoints = [[310,50], [310,80], [310,110], [310,140], [310,170], [340,170], [370,170], [370,140], [370,110], [370,80], [370,50]];

const allLetters = [...sPoints, ...fPoints, ...uPoints];

allLetters.forEach(pos => {
    const circle = createSVG("circle");
    circle.setAttribute("cx", pos[0]);
    circle.setAttribute("cy", pos[1]);
    circle.setAttribute("r", "10");
    
    // Generate a random vibrant color (HSL)
    const hue = Math.floor(Math.random() * 360);
    circle.setAttribute("fill", `hsl(${hue}, 80%, 60%)`);
    
    // Add simple interaction: Change size and colour on hover
    circle.style.transition = "r 0.2s ease";
    circle.addEventListener('mouseenter', () => circle.setAttribute("r", "15"));
    circle.addEventListener('mouseleave', () => circle.setAttribute("r", "10"));
    circle.addEventListener('mouseenter', () =>  circle.setAttribute("fill", `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`));

    svgArt.appendChild(circle);
});

artContainer.appendChild(svgArt);