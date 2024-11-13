// Getting DOM elements
const select = document.querySelector("#algorithm-select");

// Setting up the code editor
const codeEditor = CodeMirror.fromTextArea(
  document.getElementById("code-editor"),
  {
    mode: "javascript",
    lineNumbers: true,
    theme: "monokai",
    tabSize: 2,
    indentUnit: 2,
    indentWithTabs: false,
    smartIndent: true,
    lineWrapping: true,
  }
);

// Populating pre defined algorithms
Object.keys(algorithms).forEach((key) => {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = key;
  select.appendChild(option);
});

// Setting Fibonacci as initial algorithm in the editor
codeEditor.setValue(algorithms["Fibonacci"]);

// Changing the algorithm in the editor based on the selected option from the drop down
select.addEventListener("change", function () {
  const selectedAlgorithm = select.value;
  codeEditor.setValue(algorithms[selectedAlgorithm]);
});
