import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const WIDTH         = 760;
const HEIGHT        = 500;
const MAX_CIRCLES   = 10;
const ANIM_DURATION = 700;
const ANIM_STEPS    = 5;

function randomColor() {
  const h = Math.random() * 360;
  const s = 65 + Math.random() * 15; // 65–80%
  const l = 60 + Math.random() * 10; // 60–70%
  return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

let circles = [];

// dot-track setup
const dotTrack = document.getElementById("dot-track");
const dots = [];
for (let i = 0; i < MAX_CIRCLES; i++) {
  const d = document.createElement("div");
  d.className = "dot-slot";
  dotTrack.appendChild(d);
  dots.push(d);
}

function updateCounter() {
  document.getElementById("count").textContent = circles.length;
  dots.forEach((d, i) => d.classList.toggle("filled", i < circles.length));
}

// svg setup
const svg = d3.select("#canvas-wrap")
  .append("svg")
  .attr("width",  WIDTH)
  .attr("height", HEIGHT)
  .on("click", onCanvasClick);

// grid
const defs = svg.append("defs");
const pattern = defs.append("pattern")
  .attr("id", "grid")
  .attr("width", 40).attr("height", 40)
  .attr("patternUnits", "userSpaceOnUse");
pattern.append("path")
  .attr("d", "M 40 0 L 0 0 0 40")
  .attr("fill", "none")
  .attr("stroke", "#1e1e2e")
  .attr("stroke-width", 1);
svg.append("rect")
  .attr("width", WIDTH).attr("height", HEIGHT)
  .attr("fill", "url(#grid)");

const rippleLayer = svg.append("g").attr("id", "ripples");
const circleLayer = svg.append("g").attr("id", "circles");

// add circle on canvas click
function onCanvasClick(event) {
  if (event.target.tagName === "circle") return;
  const [x, y] = d3.pointer(event);
  addCircle(x, y);
}

function addCircle(x, y) {
  if (circles.length >= MAX_CIRCLES) {
    circles[0].remove();
    circles.shift();
    showToast();
  }

  const color = randomColor();

  // ripple effect
  rippleLayer.append("circle")
    .attr("cx", x).attr("cy", y)
    .attr("r", 6)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2)
    .attr("opacity", 0.7)
    .transition().duration(600)
    .attr("r", 40)
    .attr("opacity", 0)
    .remove();

  // new circle
  const c = circleLayer.append("circle")
    .attr("cx", x).attr("cy", y)
    .attr("r", 0)
    .attr("fill", color)
    .attr("fill-opacity", 0.85)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .attr("stroke-opacity", 0.25)
    .style("filter", `drop-shadow(0 0 6px ${color}88)`)
    .style("cursor", "pointer")
    .on("click", function(event) {
      event.stopPropagation();
      dismissCircle(d3.select(this), color);
    })
    .on("mouseenter", function() {
      d3.select(this)
        .transition().duration(150)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 0.6);
    })
    .on("mouseleave", function() {
      d3.select(this)
        .transition().duration(200)
        .attr("fill-opacity", 0.85)
        .attr("stroke-opacity", 0.25);
    });

  // pop-in
  c.transition().duration(300)
    .ease(d3.easeBounceOut)
    .attr("r", 15);

  circles.push(c);
  updateCounter();
}

// click circle → shrink and disappear
function dismissCircle(circle, color) {
  // disable events immediately to prevent double-click
  circle.on("click", null).on("mouseenter", null).on("mouseleave", null);

  // remove from array NOW (before DOM removal) so counter is correct
  circles = circles.filter(c => c.node() !== circle.node());
  updateCounter();

  // burst ripple
  rippleLayer.append("circle")
    .attr("cx", circle.attr("cx"))
    .attr("cy", circle.attr("cy"))
    .attr("r",  circle.attr("r"))
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2)
    .attr("opacity", 0.6)
    .transition().duration(400)
    .attr("r", +circle.attr("r") + 30)
    .attr("opacity", 0)
    .remove();

  // shrink to zero then remove from DOM
  circle.transition()
    .duration(350)
    .ease(d3.easeCubicIn)
    .attr("r", 0)
    .attr("fill-opacity", 0)
    .on("end", function() {
      circle.remove();
    });
}
