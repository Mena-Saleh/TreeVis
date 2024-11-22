// Global configuration for visualization
const container = document.getElementById("visualizer");
const activeColor = "#4EB7F9"; // Blue color for active nodes
const returnColor = "#FEB95F"; // Orange color for returned nodes
const nodeSize = 40; // Size of each node in pixels
const horizontalSpacing = 40; // Horizontal space between nodes
const verticalSpacing = 80; // Vertical space between node levels
const speed = 500; // Animation time in milliseconds

// Create text display and tree wrapper elements
const textDisplay = document.createElement("div");
textDisplay.classList.add("text-display");
container.appendChild(textDisplay);

const treeWrapper = document.createElement("div");
treeWrapper.classList.add("tree-wrapper");
container.appendChild(treeWrapper);

// Initialize state variables for tree visualization
let drawnNodes = 0; // Counter for drawn nodes
let nextX = 0; // Horizontal position tracker
let maxDepth = 0; // Maximum depth of the tree
let totalNodes = 0; // Total number of nodes in the tree

// Initialize Panzoom for interactive zooming and panning
const panzoomInstance = Panzoom(container, {
  maxScale: 10,
  minScale: 0.01,
  step: 0.2,
});
container.addEventListener("wheel", panzoomInstance.zoomWithWheel);
treeWrapper.addEventListener("touchstart", panzoomInstance.handleTouch, {
  passive: false,
});

// Get DOM elements
const progressBar = document.getElementById("progress-bar");

// Progress bar utility functions
const resetProgressBar = () => (progressBar.style.width = "0%");
const updateProgressBar = (drawn, total) => {
  progressBar.style.width = `${(drawn / total) * 100}%`;
};

// Assign horizontal and vertical positions to nodes in the tree
const assignPositions = (node, depth) => {
  node.y = depth; // Set vertical position (depth)
  maxDepth = Math.max(maxDepth, depth);

  if (!node.children.length) {
    // For leaf nodes, assign next available horizontal position
    node.x = nextX++;
    return;
  }

  // For nodes with children, process each child
  node.children.forEach((child) => {
    // Mark if node is the only child of its parent
    child.isOnlyChild = node.children.length === 1;
    assignPositions(child, depth + 1);
  });

  // Center the node based on its children's positions
  node.x = (node.children[0].x + node.children[node.children.length - 1].x) / 2;
};

// Update node positions with offset for centering
const updatePositions = (node, offsetX) => {
  // Calculate exact pixel positions considering spacing
  node.xPosition = node.x * (nodeSize + horizontalSpacing) + offsetX;
  node.yPosition = node.y * (nodeSize + verticalSpacing);

  // Recursively update child node positions
  node.children.forEach((child) => updatePositions(child, offsetX));
};

// Draw individual node element with animation
const drawNodeElement = (node, x, y, color = "transparent") => {
  return new Promise((resolve) => {
    const nodeElement = document.createElement("div");
    // Set node styling and position
    Object.assign(nodeElement.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${nodeSize}px`,
      height: `${nodeSize}px`,
      backgroundColor: color,
    });
    nodeElement.classList.add("node-element");
    // Add unique identifier for later selection
    nodeElement.setAttribute("data-node-id", node.id);
    nodeElement.innerText = node.id;
    treeWrapper.appendChild(nodeElement);

    // Pulse animation for node drawing
    requestAnimationFrame(() => {
      nodeElement.style.transform = "scale(1.3)";
      setTimeout(() => {
        nodeElement.style.transform = "scale(1.0)";
        resolve();
      }, speed / 2.5);
    });
  });
};

// Change node color with return animation
const setNodeColor = (node, color) => {
  return new Promise((resolve) => {
    // Find node by its unique ID
    const nodeElement = treeWrapper.querySelector(
      `.node-element[data-node-id="${node.id}"]`
    );
    if (nodeElement) {
      // Pulse and color change animation
      nodeElement.style.backgroundColor = color;
      nodeElement.style.transform = "scale(1.3)";

      setTimeout(() => {
        // Return to normal size
        nodeElement.style.transform = "scale(1.0)";

        // Fade to transparent
        setTimeout(() => {
          nodeElement.style.backgroundColor = "transparent";
          resolve();
        }, speed / 3.5);
      }, speed / 2);
    } else {
      resolve();
    }
  });
};

// Utility functions for formatting parameters and return values
const formatParams = (params) =>
  Object.values(params)
    .map((value) => (Array.isArray(value) ? `[${value}]` : value))
    .join(", ");

const formatReturnValue = (returnValue) =>
  Array.isArray(returnValue) ? `[${returnValue}]` : returnValue;

// Update text display with current operation
const updateTextDisplay = (text, color) => {
  textDisplay.innerText = text;
  textDisplay.style.color = color;
};

// Create SVG for drawing arrows between nodes
const createArrowSVG = () => {
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

// Draw parameters below the node
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

// Draw return value above the node
const drawReturnValue = (node, x, y) => {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const returnValueElement = document.createElement("div");
        const xOffset = node.isOnlyChild ? 10 : 0;

        // Style return value display
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

        // Fade in return value
        requestAnimationFrame(() => {
          returnValueElement.style.opacity = "1";
          resolve();
        });
      },
      node.children.length ? speed : 0
    );
  });
};

// Draw curved arrow between parent and child nodes
const drawArrow = (x1, y1, x2, y2) => {
  let svg = treeWrapper.querySelector("svg") || createArrowSVG();
  if (!svg.parentNode) {
    treeWrapper.appendChild(svg);
  }

  // Calculate arrow path with slight curve
  const arrowOffsetX = (x2 - x1) * 0.15;
  const arrowOffsetY = (y2 - y1) * 0.15;
  const startX = x1 + arrowOffsetX;
  const startY = y1 + arrowOffsetY;
  const endX = x2 - arrowOffsetX;
  const endY = y2 - arrowOffsetY;
  const controlX = (startX + endX) / 2;
  const controlY = (startY + endY) / 2 - 20;

  // Create curved SVG path
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

// Main node drawing function - recursively visualizes tree
const drawNode = async (node, parent = null) => {
  await new Promise((resolve) => {
    setTimeout(async () => {
      const { xPosition: x, yPosition: y } = node;

      // Draw connecting arrow if node has a parent
      if (parent) {
        const { xPosition: parentX, yPosition: parentY } = parent;
        drawArrow(
          parentX + nodeSize / 2,
          parentY + (5.2 / 3) * nodeSize,
          x + nodeSize / 2,
          y - 10
        );
      }

      // Update text display for current function call
      updateTextDisplay(
        `Calling fn(${formatParams(node.params)})`,
        activeColor
      );

      // Draw node and track progress
      await drawNodeElement(node, x, y, activeColor);
      drawnNodes++;
      updateProgressBar(drawnNodes, totalNodes);

      // Draw function parameters
      drawParams(node, x, y);

      // Recursively draw child nodes
      for (const child of node.children) {
        await drawNode(child, node);
      }

      // Draw return value
      await drawReturnValue(node, x, y);

      // Update text display for function return
      updateTextDisplay(
        `fn(${formatParams(node.params)}) returns ${formatReturnValue(
          node.returnValue
        )}`,
        returnColor
      );

      // Animate node color change on return
      await setNodeColor(node, returnColor);
      resolve();
    }, speed);
  });
};

// Main function to draw entire recursion graph
const drawRecursionGraph = async (graph) => {
  // Clear previous visualization
  treeWrapper.innerHTML = "";
  resetProgressBar();

  if (!graph.nodes.length) {
    console.error("Graph is empty.");
    return;
  }

  // Initialize drawing parameters
  const rootNode = graph.nodes[0];
  nextX = 0;
  maxDepth = 0;
  drawnNodes = 0;
  totalNodes = graph.nodes.length;

  // Calculate node positions
  assignPositions(rootNode, 0);

  // Determine total tree dimensions
  const totalWidth = nextX * (nodeSize + horizontalSpacing);
  const totalHeight = (maxDepth + 1) * (nodeSize + verticalSpacing);

  // Set tree wrapper dimensions
  Object.assign(treeWrapper.style, {
    width: `${totalWidth}px`,
    height: `${totalHeight}px`,
  });

  // Center the tree
  const rootXPosition = rootNode.x * (nodeSize + horizontalSpacing);
  const offsetX = totalWidth / 2 - nodeSize / 2 - rootXPosition;

  // Update node positions and start drawing
  updatePositions(rootNode, offsetX);
  await drawNode(rootNode);
};
