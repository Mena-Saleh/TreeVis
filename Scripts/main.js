// Get DOM elements
const select = document.querySelector("#algorithm-select");
const runButton = document.querySelector(".run-button");

// Initialize CodeMirror's text editor
const codeEditor = CodeMirror.fromTextArea(
    document.getElementById("code-editor"),
    {
        mode: "javascript",
        lineNumbers: true,
        theme: "material",
        tabSize: 4,
        indentUnit: 4,
        indentWithTabs: true,
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

runButton.addEventListener("click", async (event) => {
    event.preventDefault();

    // Notify that a drawing is in progress if any
    if (isDrawing) {
        swal.fire(
            "Warning",
            "Tree drawing already in progress. Please wait.",
            "warning"
        );
        return;
    }

    // Get the code string to visualize
    const code = codeEditor.getValue();

    // Annotate the code and build recursion graph
    const modifiedCode = modifyRecursiveFunction(code);
    const recursionGraph = createAndCallModifiedFunction(modifiedCode);

    // Notify if there is errors creating the graph or compiling the code
    if (!recursionGraph) {
        Swal.fire(
            "Compilation Error",
            "Error creating recursion tree.",
            "error"
        );
        return;
    }

    // Notify if graph is too large
    if (recursionGraph["nodes"].length > 200) {
        Swal.fire(
            "Drawing Error",
            "Tree is too large, try reducing the size of the parameters",
            "error"
        );
        return;
    }

    // Set the drawing flag
    isDrawing = true;

    // Draw the tree
    try {
        await drawRecursionGraph(recursionGraph); // Draw the tree
    } catch (error) {
        Swal.fire(
            "Error",
            "An error occurred while drawing the tree.",
            "error"
        );
    } finally {
        isDrawing = false; // Reset the drawing flag
    }
});
