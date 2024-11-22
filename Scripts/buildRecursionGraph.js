// Initialize the graph to store the recursion tree
let recursionGraph = { nodes: [] };
let nodeId = 0;

// Create a node in the recursion tree with given parameters and depth
function createNode(params, depthRecursionGraph) {
  const node = {
    id: nodeId++,
    params,
    depthRecursionGraph,
    children: [],
    returnValue: null,
  };
  recursionGraph.nodes.push(node);
  return node;
}

// Correctly split parameters, handling nested structures like arrays and objects
function splitParameters(paramStr) {
  const params = [];
  let currentParam = "";
  let nestingLevel = 0;

  // Iterate through each character in the parameter string
  for (let i = 0; i < paramStr.length; i++) {
    const char = paramStr[i];

    // Split on comma only when not inside nested structures
    if (char === "," && nestingLevel === 0) {
      params.push(currentParam.trim());
      currentParam = "";
    } else {
      currentParam += char;

      // Track nesting level for complex parameter types
      if (char === "(" || char === "{" || char === "[") {
        nestingLevel++;
      } else if (char === ")" || char === "}" || char === "]") {
        nestingLevel--;
      }
    }
  }

  // Add last parameter if exists
  if (currentParam) {
    params.push(currentParam.trim());
  }
  return params;
}

// Modify recursive function calls to include depth tracking and node creation
function modifyRecursiveCalls(code) {
  const functionName = "fn";
  let result = "";
  let i = 0;

  while (i < code.length) {
    // Check for function call with name 'fn'
    if (
      code.startsWith(functionName, i) &&
      /\bfn\b/.test(code.substring(i, i + functionName.length))
    ) {
      let j = i + functionName.length;
      while (code[j] && /\s/.test(code[j])) j++;

      // Process function arguments
      if (code[j] === "(") {
        const start = j;
        let parenthesesCount = 1;
        j++;

        // Find matching closing parenthesis
        while (j < code.length && parenthesesCount > 0) {
          if (code[j] === "(") parenthesesCount++;
          else if (code[j] === ")") parenthesesCount--;
          j++;
        }

        const end = j;
        const originalArgs = code.substring(start + 1, end - 1);
        const paramList = splitParameters(originalArgs);

        // Filter out special tracking parameters
        const filteredParams = paramList.filter((param) => {
          const paramName = param.split("=")[0].trim();
          return (
            paramName !== "depthRecursionGraph" &&
            paramName !== "parentNodeRecursionGraph"
          );
        });

        // Add depth and node tracking parameters
        filteredParams.push("depthRecursionGraph + 1", "currentNode");
        const modifiedCall = `fn(${filteredParams.join(", ")})`;

        result += modifiedCall;
        i = end;
        continue;
      }
    }
    result += code[i];
    i++;
  }
  return result;
}

// Create a string representation of parameter names for node tracking
function getParamsObjectString(paramsStr) {
  const paramList = splitParameters(paramsStr);

  // Filter out tracking parameters
  const filteredParams = paramList.filter((param) => {
    const paramName = param.split("=")[0].trim();
    return (
      paramName !== "depthRecursionGraph" &&
      paramName !== "parentNodeRecursionGraph"
    );
  });

  // Extract parameter names
  const paramNames = filteredParams.map((param) => param.split("=")[0].trim());
  return `{ ${paramNames.join(", ")} }`;
}

// Add depth and parent node tracking parameters to the function signature
function updateFunctionParameters(code) {
  return code.replace(/function\s+fn\s*\(([^)]*)\)/, (fullMatch, params) => {
    const paramList = splitParameters(params);
    const paramNames = paramList.map((param) => param.split("=")[0].trim());

    // Add depth parameter if not present
    if (!paramNames.includes("depthRecursionGraph")) {
      paramList.push("depthRecursionGraph = 0");
    }

    // Add parent node parameter if not present
    if (!paramNames.includes("parentNodeRecursionGraph")) {
      paramList.push("parentNodeRecursionGraph = null");
    }

    const updatedParams = paramList.join(", ");
    return `function fn(${updatedParams})`;
  });
}

// Instrument the recursive function to track its execution
function modifyRecursiveFunction(code) {
  // Update function parameters to include tracking
  code = updateFunctionParameters(code);
  const functionName = "fn";

  // Find the function header
  const functionHeaderRegex = new RegExp(
    `function\\s+${functionName}\\s*\\(([^)]*)\\)\\s*{`
  );
  const headerMatch = code.match(functionHeaderRegex);

  // Handle errors if function is not found
  if (!headerMatch) {
    Swal.fire("Error", "Function not found", "error");
    return code;
  }

  const functionParams = headerMatch[1];
  const functionStartIndex = headerMatch.index + headerMatch[0].length;
  let braceCount = 1;
  let currentIndex = functionStartIndex;

  // Find the end of the function body
  while (braceCount > 0 && currentIndex < code.length) {
    const char = code[currentIndex];
    if (char === "{") braceCount++;
    else if (char === "}") braceCount--;
    currentIndex++;
  }

  const functionEndIndex = currentIndex;
  const functionBody = code.substring(functionStartIndex, functionEndIndex - 1);
  let modifiedFunctionBody = functionBody;

  // Instrument the start of the function to create a node
  modifiedFunctionBody =
    `const currentNode = createNode(${getParamsObjectString(
      functionParams
    )}, depthRecursionGraph);
    if (parentNodeRecursionGraph) parentNodeRecursionGraph.children.push(currentNode);` +
    modifiedFunctionBody;

  // Modify recursive calls within the function
  modifiedFunctionBody = modifyRecursiveCalls(modifiedFunctionBody);

  // Track return values
  modifiedFunctionBody = modifiedFunctionBody.replace(
    /return\s+([^;]+);/g,
    (fullMatch, returnValue) => {
      return `const returnValueResult = ${returnValue};
    currentNode.returnValue = returnValueResult;
    return returnValueResult;`;
    }
  );

  // Reconstruct the modified function
  return (
    code.substring(0, functionStartIndex) +
    modifiedFunctionBody +
    code.substring(functionEndIndex - 1)
  );
}

// Create and call the modified function, setting up recursion graph tracking
function createAndCallModifiedFunction(functionString, ...args) {
  try {
    // Reset recursion graph before each function call
    recursionGraph = { nodes: [] };
    nodeId = 0;

    // Dynamically create the modified function
    const modifiedFunction = new Function(`${functionString}\nreturn fn;`);
    const callableFunction = modifiedFunction();

    // Call the function and return the recursion graph
    const result = callableFunction(...args);
    return recursionGraph;
  } catch (error) {
    // Handle any compilation errors
    Swal.fire("Compilation Error", error.message, "error");
  }
}
