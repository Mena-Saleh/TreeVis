// Global variables and elements
const container = document.getElementById("visualizer");
const activeColor = "#4EB7F9";
const returnColor = "#FEB95F";
const nodeSize = 40;
const horizontalSpacing = 40;
const verticalSpacing = 80;
const speed = 500;

// Create DOM elements once
const textDisplay = document.createElement("div");
textDisplay.classList.add("text-display");
container.appendChild(textDisplay);

const treeWrapper = document.createElement("div");
treeWrapper.classList.add("tree-wrapper");
container.appendChild(treeWrapper);

// State variables
let drawnNodes = 0;
let nextX = 0;
let maxDepth = 0;
let totalNodes = 0;
let currentScale = 1;
let currentTranslateX = 0;
let currentTranslateY = 0;
let isPanning = false;
let startXPan, startYPan;
let initialDistance = null;

// Cache DOM elements
const progressBar = document.getElementById("progress-bar");

// Helper functions with performance optimizations
const resetProgressBar = () => (progressBar.style.width = "0%");

const updateProgressBar = (drawn, total) => {
  progressBar.style.width = `${(drawn / total) * 100}%`;
};

const assignPositions = (node, depth) => {
  node.y = depth;
  maxDepth = Math.max(maxDepth, depth);

  if (!node.children.length) {
    node.x = nextX++;
    return;
  }

  node.children.forEach((child) => {
    child.isOnlyChild = node.children.length === 1;
    assignPositions(child, depth + 1);
  });

  node.x = (node.children[0].x + node.children[node.children.length - 1].x) / 2;
};

const updatePositions = (node, offsetX) => {
  node.xPosition = node.x * (nodeSize + horizontalSpacing) + offsetX;
  node.yPosition = node.y * (nodeSize + verticalSpacing);
  node.children.forEach((child) => updatePositions(child, offsetX));
};

// Optimized drawing functions
const drawNodeElement = (node, x, y, color = "transparent") => {
  return new Promise((resolve) => {
    const nodeElement = document.createElement("div");
    Object.assign(nodeElement.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${nodeSize}px`,
      height: `${nodeSize}px`,
      backgroundColor: color,
    });
    nodeElement.classList.add("node-element");
    nodeElement.innerText = node.id;
    treeWrapper.appendChild(nodeElement);

    // Use requestAnimationFrame for smoother animations
    requestAnimationFrame(() => {
      nodeElement.style.transform = "scale(1.3)";
      setTimeout(() => {
        nodeElement.style.transform = "scale(1.0)";
        resolve();
      }, 150);
    });
  });
};

const setNodeColor = (node, x, y, color) => {
  return new Promise((resolve) => {
    const nodeElement = treeWrapper.querySelector(
      `div[style*="left: ${x}px"][style*="top: ${y}px"]`
    );
    if (nodeElement) {
      nodeElement.style.backgroundColor = color;
      setTimeout(() => {
        nodeElement.style.backgroundColor = "transparent";
        resolve();
      }, 500);
    } else {
      resolve();
    }
  });
};

// Optimized formatting functions
const formatParams = (params) =>
  Object.values(params)
    .map((value) => (Array.isArray(value) ? `[${value}]` : value))
    .join(", ");

const formatReturnValue = (returnValue) =>
  Array.isArray(returnValue) ? `[${returnValue}]` : returnValue;

const updateTextDisplay = (text, color) => {
  textDisplay.innerText = text;
  textDisplay.style.color = color;
};

// Optimized SVG handling
const createSVG = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("arrow");
  svg.setAttribute("width", treeWrapper.scrollWidth);
  svg.setAttribute("height", treeWrapper.scrollHeight);

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "marker"
  );

  marker.setAttribute("id", "arrowhead");
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("refX", "0");
  marker.setAttribute("refY", "3.5");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "strokeWidth");

  const arrowHeadPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  arrowHeadPath.setAttribute("d", "M0,0 L0,7 L10,3.5 z");
  arrowHeadPath.setAttribute("fill", "white");

  marker.appendChild(arrowHeadPath);
  defs.appendChild(marker);
  svg.appendChild(defs);
  return svg;
};

// Drawing functions
const drawParams = (node, x, y) => {
  const paramsElement = document.createElement("div");
  Object.assign(paramsElement.style, {
    left: `${x + nodeSize / 2}px`,
    top: `${y + nodeSize + 10}px`,
    color: activeColor,
  });
  paramsElement.classList.add("params-element");
  paramsElement.innerText = `fn(${formatParams(node.params)})`;
  treeWrapper.appendChild(paramsElement);
};

const drawReturnValue = (node, x, y) => {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const returnValueElement = document.createElement("div");
        const xOffset = node.isOnlyChild ? 10 : 0;

        Object.assign(returnValueElement.style, {
          left: `${x + nodeSize / 2 + xOffset}px`,
          top: `${y - 40}px`,
          width: `${nodeSize}px`,
          color: returnColor,
          opacity: "0",
          transition: "opacity 1s",
        });

        returnValueElement.classList.add("return-value-element");
        returnValueElement.innerText =
          node.returnValue !== null ? formatReturnValue(node.returnValue) : "";

        treeWrapper.appendChild(returnValueElement);

        requestAnimationFrame(() => {
          returnValueElement.style.opacity = "1";
          resolve();
        });
      },
      node.children.length ? speed : 0
    );
  });
};

const drawArrow = (x1, y1, x2, y2) => {
  let svg = treeWrapper.querySelector("svg") || createSVG();
  if (!svg.parentNode) {
    treeWrapper.appendChild(svg);
  }

  const arrowOffsetX = (x2 - x1) * 0.15;
  const arrowOffsetY = (y2 - y1) * 0.15;
  const startX = x1 + arrowOffsetX;
  const startY = y1 + arrowOffsetY;
  const endX = x2 - arrowOffsetX;
  const endY = y2 - arrowOffsetY;
  const controlX = (startX + endX) / 2;
  const controlY = (startY + endY) / 2 - 20;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`
  );
  path.setAttribute("stroke", "white");
  path.setAttribute("stroke-width", "1");
  path.setAttribute("fill", "none");
  path.setAttribute("marker-end", "url(#arrowhead)");

  svg.appendChild(path);
};

// Main drawing function
const drawNode = async (node, parent = null) => {
  await new Promise((resolve) => {
    setTimeout(async () => {
      const { xPosition: x, yPosition: y } = node;

      // If there's a parent, draw the arrow BEFORE drawing the child node
      if (parent) {
        const { xPosition: parentX, yPosition: parentY } = parent;
        drawArrow(
          parentX + nodeSize / 2,
          parentY + (5.2 / 3) * nodeSize,
          x + nodeSize / 2,
          y - 10
        );
      }

      updateTextDisplay(
        `Calling fn(${formatParams(node.params)})`,
        activeColor
      );
      await drawNodeElement(node, x, y, activeColor);

      drawnNodes++;
      updateProgressBar(drawnNodes, totalNodes);

      drawParams(node, x, y);

      for (const child of node.children) {
        await drawNode(child, node);
      }

      await drawReturnValue(node, x, y);

      updateTextDisplay(
        `fn(${formatParams(node.params)}) returns ${formatReturnValue(
          node.returnValue
        )}`,
        returnColor
      );

      await setNodeColor(node, x, y, returnColor);
      resolve();
    }, speed);
  });
};

// Event handlers
const updateTransform = () => {
  treeWrapper.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
};

const startPan = (e) => {
  e.preventDefault();
  isPanning = true;
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);
  startXPan = clientX - currentTranslateX;
  startYPan = clientY - currentTranslateY;
  container.style.cursor = "grabbing";
};

const movePan = (e) => {
  if (!isPanning) return;
  e.preventDefault();
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

const handlePinchZoom = (e) => {
  if (e.touches.length !== 2) return;
  e.preventDefault();

  const touch1 = e.touches[0];
  const touch2 = e.touches[1];
  const distance = Math.hypot(
    touch1.clientX - touch2.clientX,
    touch1.clientY - touch2.clientY
  );

  if (initialDistance === null) {
    initialDistance = distance;
    return;
  }

  const scaleChange = distance / initialDistance;
  currentScale = Math.min(Math.max(currentScale * scaleChange, 0.1), 5);
  initialDistance = distance;
  updateTransform();
};

const handleWheelZoom = (e) => {
  e.preventDefault();
  const zoomSensitivity = 0.001;
  const scaleChange = 1 - e.deltaY * zoomSensitivity;
  const newScale = currentScale * scaleChange;
  currentScale = Math.min(Math.max(newScale, 0.1), 5);

  const rect = container.getBoundingClientRect();
  const offsetX = e.clientX - rect.left - currentTranslateX;
  const offsetY = e.clientY - rect.top - currentTranslateY;

  currentTranslateX -= offsetX * (scaleChange - 1);
  currentTranslateY -= offsetY * (scaleChange - 1);

  updateTransform();
};

// Event listeners
container.addEventListener("mousedown", startPan);
container.addEventListener("mousemove", movePan);
container.addEventListener("mouseup", endPan);
container.addEventListener("mouseleave", endPan);
container.addEventListener("touchstart", startPan, { passive: false });
container.addEventListener("touchmove", movePan, { passive: false });
container.addEventListener("touchend", endPan);
container.addEventListener("touchmove", handlePinchZoom, { passive: false });
container.addEventListener("touchend", () => (initialDistance = null));
container.addEventListener("touchcancel", () => (initialDistance = null));
container.addEventListener("wheel", handleWheelZoom, { passive: false });

// Main drawing function
const drawRecursionGraph = async (graph) => {
  treeWrapper.innerHTML = "";
  resetProgressBar();

  if (!graph.nodes.length) {
    console.error("Graph is empty.");
    return;
  }

  const rootNode = graph.nodes[0];
  nextX = 0;
  maxDepth = 0;
  drawnNodes = 0;
  totalNodes = graph.nodes.length;

  assignPositions(rootNode, 0);

  const totalWidth = nextX * (nodeSize + horizontalSpacing);
  const totalHeight = (maxDepth + 1) * (nodeSize + verticalSpacing);

  Object.assign(treeWrapper.style, {
    width: `${totalWidth}px`,
    height: `${totalHeight}px`,
  });

  const rootXPosition = rootNode.x * (nodeSize + horizontalSpacing);
  const offsetX = totalWidth / 2 - nodeSize / 2 - rootXPosition;

  updatePositions(rootNode, offsetX);
  await drawNode(rootNode);
};
