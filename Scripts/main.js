// Get DOM elements
const select = document.querySelector("#algorithm-select");
const runButton = document.querySelector(".run-button");
const codeEditor = CodeMirror.fromTextArea(
  document.getElementById("code-editor"),
  {
    mode: "javascript",
    lineNumbers: true,
    theme: "monokai",
    tabSize: 2,
    indentUnit: 2,
    indentWithTabs: false,
    lineWrapping: true,
  }
);

// Populate predefined algorithms
Object.keys(algorithms).forEach((key) => {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = key;
  select.appendChild(option);
});

// Set initial algorithm
codeEditor.setValue(algorithms["Fibonacci"]);

// Update editor when algorithm is changed
select.addEventListener("change", function () {
  const selectedAlgorithm = select.value;
  codeEditor.setValue(algorithms[selectedAlgorithm]);
});

let isDrawing = false; // Track if the tree is currently being drawn

runButton.addEventListener("click", async () => {
  if (isDrawing) {
    swal.fire(
      "Warning",
      "Tree drawing already in progress. Please wait.",
      "warning"
    );
    return;
  }

  const code = codeEditor.getValue();
  const modifiedCode = modifyRecursiveFunction(code);
  const recursionTree = createAndCallModifiedFunction(modifiedCode);

  if (!recursionTree) {
    Swal.fire("Compilation Error", "Error creating recursion tree.", "error");
    return;
  }

  if (recursionTree["nodes"].length > 100) {
    Swal.fire(
      "Drawing Error",
      "Tree is too large, try reducing the size of the parameters",
      "error"
    );
    return;
  }

  // Reset the tree and set the drawing flag
  treeWrapper.innerHTML = ""; // Clear the tree container
  isDrawing = true;

  try {
    await drawRecursionGraph(recursionTree); // Draw the tree
  } catch (error) {
    console.error("Error during drawing:", error);
    Swal.fire("Error", "An error occurred while drawing the tree.", "error");
  } finally {
    isDrawing = false; // Reset the drawing flag
  }
});
