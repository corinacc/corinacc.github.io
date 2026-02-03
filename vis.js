// Helper function to create SVG elements with the correct namespace
function createSVG(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

//1. STATISTICAL VISUALIZATION

const visContainer = document.getElementById('vis-container');
const svgVis = createSVG("svg");
svgVis.setAttribute("width", "100%");
svgVis.setAttribute("height", "200");
svgVis.setAttribute("viewBox", "0 0 400 200");

// Draw the Bell Curve Path
const bellPath = createSVG("path");
// M=Start, Q=Quadratic Curve (Control Point, End Point)
bellPath.setAttribute("d", "M 50 180 Q 200 -50 350 180");
bellPath.setAttribute("stroke", "#007AFF");
bellPath.setAttribute("fill", "rgba(0, 122, 255, 0.1)");
bellPath.setAttribute("stroke-width", "3");

svgVis.appendChild(bellPath);
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