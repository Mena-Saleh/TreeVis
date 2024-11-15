function drawRecursionGraph(containerId, graph, speed = 200) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id ${containerId} not found.`);
    return;
  }
  container.innerHTML = "";

  // Create an inner wrapper
  const innerWrapper = document.createElement("div");
  innerWrapper.style.position = "relative";
  innerWrapper.style.transformOrigin = "0 0"; // Set transform origin for scaling
  container.appendChild(innerWrapper);

  // Create a text display element above the graph
  const textDisplay = document.createElement("div");
  textDisplay.style.position = "absolute";
  textDisplay.style.top = "10px";
  textDisplay.style.left = "50%";
  textDisplay.style.transform = "translateX(-50%)";
  textDisplay.style.color = "white";
  textDisplay.style.fontSize = "18px";
  textDisplay.style.fontWeight = "bold";
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
          "#8A9FEE"
        );

        await drawNodeElement(node, x, y, "#8A9FEE"); // Set active color

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
          "#DA7635"
        );

        await setNodeColor(node, x, y, "#DA7635"); // Set return color briefly

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
      nodeElement.style.position = "absolute";
      nodeElement.style.left = `${x}px`;
      nodeElement.style.top = `${y}px`;
      nodeElement.style.width = `${nodeSize}px`;
      nodeElement.style.height = `${nodeSize}px`;
      nodeElement.style.borderRadius = "50%";
      nodeElement.style.border = "2px solid white";
      nodeElement.style.backgroundColor = color;
      nodeElement.style.color = "white";
      nodeElement.style.fontWeight = "bold";
      nodeElement.style.display = "flex";
      nodeElement.style.justifyContent = "center";
      nodeElement.style.alignItems = "center";
      nodeElement.style.transform = "scale(0.7)";
      nodeElement.style.transition =
        "background-color 0.5s ease, transform 0.3s ease";
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
    paramsElement.style.position = "absolute";
    paramsElement.style.left = `${x + nodeSize / 2}px`;
    paramsElement.style.top = `${y + nodeSize + 10}px`;
    paramsElement.style.transform = "translateX(-50%)";
    paramsElement.style.height = "auto";
    paramsElement.style.textAlign = "center";
    paramsElement.style.color = "#8A9FEE";
    paramsElement.style.whiteSpace = "nowrap";

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

          // Apply xOffset if this node is an only child
          const xOffset = node.isOnlyChild ? 10 : 0;

          returnValueElement.style.position = "absolute";
          returnValueElement.style.left = `${x + nodeSize / 2 + xOffset}px`;
          returnValueElement.style.top = `${y - 40}px`; // Adjusted to prevent overlap with arrow
          returnValueElement.style.transform = "translateX(-50%)";
          returnValueElement.style.width = `${nodeSize}px`;
          returnValueElement.style.height = "20px";
          returnValueElement.style.textAlign = "center";
          returnValueElement.style.color = "#DA7635"; // Set return value color to orange
          returnValueElement.style.whiteSpace = "nowrap";

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
      svg.style.position = "absolute";
      svg.style.left = "0";
      svg.style.top = "0";
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.style.pointerEvents = "none";
      svg.setAttribute("width", innerWrapper.scrollWidth);
      svg.setAttribute("height", innerWrapper.scrollHeight);
      innerWrapper.appendChild(svg);
    }

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "white");
    line.setAttribute("stroke-width", "1");
    line.setAttribute("marker-end", "url(#arrowhead)");

    svg.appendChild(line);

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

      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", "M0,0 L0,7 L10,3.5 z");
      path.setAttribute("fill", "white");

      marker.appendChild(path);
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
  let isPanning = false;
  let startX, startY;
  let currentScale = 1;
  let currentTranslateX = 0;
  let currentTranslateY = 0;

  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    currentScale += delta;
    currentScale = Math.min(Math.max(0.1, currentScale), 5);
    updateTransform();
  });

  container.addEventListener("mousedown", (e) => {
    isPanning = true;
    startX = e.clientX - currentTranslateX;
    startY = e.clientY - currentTranslateY;
    container.style.cursor = "grabbing";
  });

  container.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    currentTranslateX = e.clientX - startX;
    currentTranslateY = e.clientY - startY;
    updateTransform();
  });

  container.addEventListener("mouseup", () => {
    isPanning = false;
    container.style.cursor = "default";
  });

  container.addEventListener("mouseleave", () => {
    isPanning = false;
    container.style.cursor = "default";
  });

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

    // Calculate the initial scale to fit the innerWrapper within the container
    const containerRect = container.getBoundingClientRect();
    const scaleX = containerRect.width / totalWidth;
    const scaleY = containerRect.height / totalHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale if content is smaller

    // Apply initial scaling
    currentScale = scale;
    updateTransform();

    // Center the innerWrapper
    currentTranslateX = (containerRect.width - totalWidth * currentScale) / 2;
    currentTranslateY = (containerRect.height - totalHeight * currentScale) / 2;
    updateTransform();

    // Update positions with offsetX set to zero since we're centering via CSS
    updatePositions(rootNode, 0);

    await drawNode(rootNode);
  })();
}
