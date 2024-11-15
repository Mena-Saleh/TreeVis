function drawRecursionGraph(containerId, graph, speed = 500) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id ${containerId} not found.`);
    return;
  }
  container.innerHTML = "";

  // Colors
  activeColor = "#6699CC";
  returnColor = "#F9C784";

  // Create an inner wrapper
  const innerWrapper = document.createElement("div");
  innerWrapper.classList.add("tree-wrapper"); // Class for styling

  container.appendChild(innerWrapper);

  // Create a text display element above the graph
  const textDisplay = document.createElement("div");
  textDisplay.classList.add("text-display");

  container.appendChild(textDisplay);

  const nodeSize = 40;
  const horizontalSpacing = 40;
  const verticalSpacing = 80;

  let nextX = 0;
  let maxDepth = 0;

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

        // Clear the text display after a short delay
        setTimeout(() => {
          updateTextDisplay("", "white");
        }, speed);

        resolve();
      }, speed);
    });
  }

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
      innerWrapper.appendChild(nodeElement);

      setTimeout(() => {
        nodeElement.style.transform = "scale(1.3)";
      }, 50);

      setTimeout(() => {
        nodeElement.style.transform = "scale(1.0)";
      }, 200);

      resolve();
    });
  }

  function setNodeColor(node, x, y, color) {
    return new Promise((resolve) => {
      const nodeElement = innerWrapper.querySelector(
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

  function drawParams(node, x, y) {
    const paramsElement = document.createElement("div");
    paramsElement.classList.add("params-element");
    paramsElement.style.left = `${x + nodeSize / 2}px`;
    paramsElement.style.top = `${y + nodeSize + 10}px`;
    paramsElement.style.color = activeColor;

    // Format params as "fn(param1, param2, ...)"
    const paramsText = `fn(${formatParams(node.params)})`;

    paramsElement.innerText = paramsText;
    innerWrapper.appendChild(paramsElement);
  }

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
            node.returnValue !== null
              ? formatReturnValue(node.returnValue)
              : "";
          innerWrapper.appendChild(returnValueElement);

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

  function drawArrow(x1, y1, x2, y2) {
    const svgNS = "http://www.w3.org/2000/svg";
    let svg = innerWrapper.querySelector("svg");
    if (!svg) {
      svg = document.createElementNS(svgNS, "svg");
      svg.classList.add("arrow");
      svg.setAttribute("width", innerWrapper.scrollWidth * 100);
      svg.setAttribute("height", innerWrapper.scrollHeight * 100);

      innerWrapper.appendChild(svg);
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

  function updateTextDisplay(text, color) {
    textDisplay.innerText = text;
    textDisplay.style.color = color;
  }

  function formatParams(params) {
    return Object.values(params)
      .map((value) => (Array.isArray(value) ? `[${value}]` : value))
      .join(", ");
  }

  function formatReturnValue(returnValue) {
    return Array.isArray(returnValue) ? `[${returnValue}]` : returnValue;
  }

  // Set up zoom and pan functionality before drawing
  // Panning and zoom variables
  let isPanning = false;
  let startX, startY;
  let currentScale = 1;
  let currentTranslateX = 0;
  let currentTranslateY = 0;
  let initialDistance = null;

  // Panning - prevent scrolling on the main page during panning
  const startPan = (e) => {
    e.preventDefault(); // Prevent default to stop page scrolling

    isPanning = true;
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    startX = clientX - currentTranslateX;
    startY = clientY - currentTranslateY;
    container.style.cursor = "grabbing";
  };

  const movePan = (e) => {
    if (!isPanning) return;

    e.preventDefault(); // Prevent default to stop page scrolling

    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    currentTranslateX = clientX - startX;
    currentTranslateY = clientY - startY;
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

  // Update the transform style to apply pan and zoom
  function updateTransform() {
    innerWrapper.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
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

  function updateTransform() {
    innerWrapper.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
  }

  (async function () {
    if (graph.nodes.length === 0) {
      console.error("Graph is empty.");
      return;
    }

    const rootNode = graph.nodes[0];

    nextX = 0;
    maxDepth = 0;
    assignPositions(rootNode, 0);

    const totalWidth = nextX * (nodeSize + horizontalSpacing);
    const totalHeight = (maxDepth + 1) * (nodeSize + verticalSpacing);

    // Set the size of the innerWrapper
    innerWrapper.style.width = `${totalWidth}px`;
    innerWrapper.style.height = `${totalHeight}px`;

    updateTransform();

    // Update positions with offsetX set to zero since we're centering via CSS
    updatePositions(rootNode, 0);

    await drawNode(rootNode);
  })();
}
