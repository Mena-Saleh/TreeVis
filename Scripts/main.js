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

// Run button functionality
runButton.addEventListener("click", () => {
  const visualizer = document.getElementById("visualizer");

  // Clear the visualizer container and remove all children to reset previous runs
  if (visualizer) {
    visualizer.innerHTML = "";
  }
  const code = codeEditor.getValue();
  const modifiedCode = modifyRecursiveFunction(code);
  const recursionTree = createAndCallModifiedFunction(modifiedCode);

  if (!recursionTree) {
    Swal.fire("Compilation Error", "Error creating recursion tree.", "error");
    return;
  }
  // Visualize the recursion tree
  if (recursionTree["nodes"].length > 100) {
    Swal.fire(
      "Drawing Error",
      "Tree is too large, try reducing the size of the parameters",
      "error"
    );
    return;
  }
  drawRecursionGraph("visualizer", recursionGraph, 600);
  //Need to handle large inputs and panning to the right place
});
