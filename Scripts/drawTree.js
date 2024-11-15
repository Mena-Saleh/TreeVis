// Global variables and elements
const container = document.getElementById("visualizer");

// Colors
activeColor = "#6699CC";
returnColor = "#F9C784";

// Create a text display element above the graph
const textDisplay = document.createElement("div");
textDisplay.classList.add("text-display");

container.appendChild(textDisplay);

// Create an inner wrapper
const treeWrapper = document.createElement("div");
treeWrapper.classList.add("tree-wrapper"); // Class for styling

container.appendChild(treeWrapper);

// Drawing related variables
const nodeSize = 40;
const horizontalSpacing = 40;
const verticalSpacing = 80;
const speed = 500;
let drawnNodes = 0; // Track the number of nodes drawn

let nextX = 0;
let maxDepth = 0;
// Helper functions

// Resets the bar width
function resetProgressBar() {
  const progressBar = document.getElementById("progress-bar");
  progressBar.style.width = "0%";
}

// Adds a step to the progress bar
function updateProgressBar(drawnNodes, totalNodes) {
  const progressBar = document.getElementById("progress-bar");
  const progress = (drawnNodes / totalNodes) * 100;
  progressBar.style.width = `${progress}%`;
}

function assignPositions(node, depth) {
  node.y = depth;
  if (depth > maxDepth) maxDepth = depth;

  if (node.children.length === 0) {
    node.x = nextX;
    nextX += 1;
  } else {
    for (const child of node.children) {
      // Set isOnlyChild to true if the node has only one child
      child.isOnlyChild = node.children.length === 1;
      assignPositions(child, depth + 1);
    }
    const firstChild = node.children[0];
    const lastChild = node.children[node.children.length - 1];
    node.x = (firstChild.x + lastChild.x) / 2;
  }
}

function updatePositions(node, offsetX) {
  node.xPosition = node.x * (nodeSize + horizontalSpacing) + offsetX;
  node.yPosition = node.y * (nodeSize + verticalSpacing);
  for (const child of node.children) {
    updatePositions(child, offsetX);
  }
}

// DFS algorithm to draw a node and its params, then all children in its sub tree similarly, and finally return values of that node
async function drawNode(node, parent = null) {
  await new Promise((resolve) => {
    setTimeout(async () => {
      const x = node.xPosition;
      const y = node.yPosition;

      // Update the text display to show the function call
      updateTextDisplay(
        `Calling fn(${formatParams(node.params)})`,
        activeColor
      );

      await drawNodeElement(node, x, y, activeColor); // Set active color

      drawnNodes++;
      updateProgressBar(drawnNodes, totalNodes);

      if (parent) {
        const parentX = parent.xPosition;
        const parentY = parent.yPosition;
        drawArrow(
          parentX + nodeSize / 2,
          parentY + (5.2 / 3) * nodeSize,
          x + nodeSize / 2,
          y - 10
        );
      }

      drawParams(node, x, y);

      for (const child of node.children) {
        await drawNode(child, node);
      }

      await drawReturnValue(node, x, y);

      // Update the text display to show the function return
      updateTextDisplay(
        `fn(${formatParams(node.params)}) returns ${formatReturnValue(
          node.returnValue
        )}`,
        returnColor
      );

      await setNodeColor(node, x, y, returnColor); // Set return color briefly

      resolve();
    }, speed);
  });
}

// Adding the node div element to DOM
function drawNodeElement(node, x, y, color = "transparent") {
  return new Promise((resolve) => {
    const nodeElement = document.createElement("div");
    nodeElement.classList.add("node-element");
    nodeElement.style.left = `${x}px`;
    nodeElement.style.top = `${y}px`;
    nodeElement.style.width = `${nodeSize}px`;
    nodeElement.style.height = `${nodeSize}px`;
    nodeElement.style.backgroundColor = color;
    nodeElement.innerText = node.id;
    treeWrapper.appendChild(nodeElement);

    setTimeout(() => {
      nodeElement.style.transform = "scale(1.3)";
    }, 50);

    setTimeout(() => {
      nodeElement.style.transform = "scale(1.0)";
    }, 200);

    resolve();
  });
}

// Toggle a color burst
function setNodeColor(node, x, y, color) {
  return new Promise((resolve) => {
    const nodeElement = treeWrapper.querySelector(
      `div[style*="left: ${x}px"][style*="top: ${y}px"]`
    );
    if (nodeElement) {
      nodeElement.style.backgroundColor = color;
      setTimeout(() => {
        nodeElement.style.backgroundColor = "transparent"; // Reset to transparent
        resolve();
      }, 500); // Keep color for a short time
    }
  });
}

// Draw params of a given node
function drawParams(node, x, y) {
  const paramsElement = document.createElement("div");
  paramsElement.classList.add("params-element");
  paramsElement.style.left = `${x + nodeSize / 2}px`;
  paramsElement.style.top = `${y + nodeSize + 10}px`;
  paramsElement.style.color = activeColor;

  // Format params as "fn(param1, param2, ...)"
  const paramsText = `fn(${formatParams(node.params)})`;

  paramsElement.innerText = paramsText;
  treeWrapper.appendChild(paramsElement);
}

// Draw return values of a given node
function drawReturnValue(node, x, y) {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const returnValueElement = document.createElement("div");
        returnValueElement.classList.add("return-value-element");
        // Apply xOffset if this node is an only child (so that the return value doesn't overlap with the vertical arrow)
        const xOffset = node.isOnlyChild ? 10 : 0;

        returnValueElement.style.left = `${x + nodeSize / 2 + xOffset}px`;
        returnValueElement.style.top = `${y - 40}px`; // Adjusted to prevent overlap with arrow
        returnValueElement.style.width = `${nodeSize}px`;
        returnValueElement.style.color = returnColor; // Set return value color to orange

        // Format return value
        returnValueElement.innerText =
          node.returnValue !== null ? formatReturnValue(node.returnValue) : "";
        treeWrapper.appendChild(returnValueElement);

        returnValueElement.style.opacity = "0";
        returnValueElement.style.transition = "opacity 1s";
        setTimeout(() => {
          returnValueElement.style.opacity = "1";
        }, 50);

        resolve();
      },
      node.children.length === 0 ? 0 : speed
    ); // Delay return value for non-leaf nodes
  });
}

// Draw arrow from parent to child
function drawArrow(x1, y1, x2, y2) {
  const svgNS = "http://www.w3.org/2000/svg";
  let svg = treeWrapper.querySelector("svg");
  if (!svg) {
    svg = document.createElementNS(svgNS, "svg");
    svg.classList.add("arrow");
    svg.setAttribute("width", treeWrapper.scrollWidth * 100);
    svg.setAttribute("height", treeWrapper.scrollHeight * 100);

    treeWrapper.appendChild(svg);
  }

  // Adjust the starting and ending points for a tighter arrow
  const arrowOffsetX = (x2 - x1) * 0.15; // 15% offset for a tighter arrow
  const arrowOffsetY = (y2 - y1) * 0.15; // 15% offset for a tighter arrow

  const startX = x1 + arrowOffsetX;
  const startY = y1 + arrowOffsetY;
  const endX = x2 - arrowOffsetX;
  const endY = y2 - arrowOffsetY;

  // Optionally add curvature by defining a control point for a quadratic Bezier curve
  const controlX = (startX + endX) / 2;
  const controlY = (startY + endY) / 2 - 20; // Move the control point slightly upwards for a gentle curve

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute(
    "d",
    `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`
  ); // Quadratic Bezier curve path
  path.setAttribute("stroke", "white");
  path.setAttribute("stroke-width", "1");
  path.setAttribute("fill", "none");
  path.setAttribute("marker-end", "url(#arrowhead)");

  svg.appendChild(path);

  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(svgNS, "defs");
    svg.appendChild(defs);

    const marker = document.createElementNS(svgNS, "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "0");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");

    const arrowHeadPath = document.createElementNS(svgNS, "path");
    arrowHeadPath.setAttribute("d", "M0,0 L0,7 L10,3.5 z");
    arrowHeadPath.setAttribute("fill", "white");

    marker.appendChild(arrowHeadPath);
    defs.appendChild(marker);
  }
}

// Update the status text
function updateTextDisplay(text, color) {
  textDisplay.innerText = text;
  textDisplay.style.color = color;
}

// Format params and return values by removing the param name and quotes and equal signs etc..
function formatParams(params) {
  return Object.values(params)
    .map((value) => (Array.isArray(value) ? `[${value}]` : value))
    .join(", ");
}

function formatReturnValue(returnValue) {
  return Array.isArray(returnValue) ? `[${returnValue}]` : returnValue;
}

// Setting up panning and zoom functionality

// Panning and zoom variables
let isPanning = false;
let startXPan, startYPan;
let currentScale = 1;
let currentTranslateX = 0;
let currentTranslateY = 0;
let initialDistance = null;

// Panning - prevent scrolling on the main page during panning
const startPan = (e) => {
  e.preventDefault(); // Prevent default to stop page scrolling

  isPanning = true;
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);
  startXPan = clientX - currentTranslateX;
  startYPan = clientY - currentTranslateY;
  container.style.cursor = "grabbing";
};

const movePan = (e) => {
  if (!isPanning) return;

  e.preventDefault(); // Prevent default to stop page scrolling

  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);
  currentTranslateX = clientX - startXPan;
  currentTranslateY = clientY - startYPan;
  updateTransform();
};

const endPan = () => {
  isPanning = false;
  container.style.cursor = "default";
};

// Pinch-to-zoom - calculates the scale based on the distance between two touch points
const handlePinchZoom = (e) => {
  if (e.touches.length === 2) {
    e.preventDefault(); // Prevent default to stop page scrolling

    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    const distance = Math.sqrt(
      (touch1.clientX - touch2.clientX) ** 2 +
        (touch1.clientY - touch2.clientY) ** 2
    );

    if (initialDistance === null) {
      initialDistance = distance; // Set initial distance for the pinch gesture
    } else {
      const scaleChange = distance / initialDistance;
      currentScale = Math.min(Math.max(currentScale * scaleChange, 0.1), 5); // Keep scale between 0.1 and 5
      initialDistance = distance; // Update initial distance
      updateTransform();
    }
  }
};

const endPinchZoom = () => {
  initialDistance = null; // Reset initial distance
};

// Wheel event handler for zooming
const handleWheelZoom = (e) => {
  e.preventDefault(); // Prevent default scrolling behavior

  const delta = e.deltaY;

  // Define zoom sensitivity
  const zoomSensitivity = 0.001; // Adjust this value for faster/slower zooming

  // Calculate the scale change
  const scaleChange = 1 - delta * zoomSensitivity;

  // Calculate the new scale, ensuring it stays within bounds
  const newScale = currentScale * scaleChange;
  currentScale = Math.min(Math.max(newScale, 0.1), 5); // Clamp between 0.1 and 5

  // Get the mouse position relative to the container
  const rect = container.getBoundingClientRect();
  const offsetX = e.clientX - rect.left - currentTranslateX;
  const offsetY = e.clientY - rect.top - currentTranslateY;

  // Adjust the translation to zoom towards the mouse pointer
  currentTranslateX -= offsetX * (scaleChange - 1);
  currentTranslateY -= offsetY * (scaleChange - 1);

  updateTransform();
};

// Update the transform style to apply pan and zoom
function updateTransform() {
  treeWrapper.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
}

// Add event listeners for both mouse and touch events
container.addEventListener("mousedown", startPan);
container.addEventListener("mousemove", movePan);
container.addEventListener("mouseup", endPan);
container.addEventListener("mouseleave", endPan);
container.addEventListener("touchstart", startPan, { passive: false });
container.addEventListener("touchmove", movePan, { passive: false });
container.addEventListener("touchend", endPan);

// Add pinch-to-zoom event listeners for touch devices
container.addEventListener("touchmove", handlePinchZoom, { passive: false });
container.addEventListener("touchend", endPinchZoom);
container.addEventListener("touchcancel", endPinchZoom);

// Add wheel event listener for mouse wheel zooming
container.addEventListener("wheel", handleWheelZoom, { passive: false });

// Main function to call to start building the tree, calls draw node on the root node to start DFS.
const drawRecursionGraph = async (graph) => {
  // Clear the tree wrapper and remove all children to reset previous runs
  treeWrapper.innerHTML = "";

  resetProgressBar(); // Reset progress bar

  if (graph.nodes.length === 0) {
    console.error("Graph is empty.");
    return;
  }

  // Get the root node
  const rootNode = graph.nodes[0];

  // Reset some variables
  nextX = 0;
  maxDepth = 0;
  drawnNodes = 0;
  totalNodes = graph.nodes.length; // Set the total number of nodes

  assignPositions(rootNode, 0);

  const totalWidth = nextX * (nodeSize + horizontalSpacing);
  const totalHeight = (maxDepth + 1) * (nodeSize + verticalSpacing);

  // Set the size of the innerWrapper
  treeWrapper.style.width = `${totalWidth}px`;
  treeWrapper.style.height = `${totalHeight}px`;

  updateTransform();

  // Update positions with offsetX set to zero since we're centering via CSS
  updatePositions(rootNode, 0);
  await drawNode(rootNode);
};
