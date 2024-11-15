// Initialize the graph to store the recursion tree
let recursionGraph = { nodes: [] };
let nodeId = 0;

// Helper function to create a node in the recursion tree
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

// Helper function to split parameters correctly
function splitParameters(paramStr) {
  const params = [];
  let currentParam = "";
  let nestingLevel = 0;
  for (let i = 0; i < paramStr.length; i++) {
    const char = paramStr[i];
    if (char === "," && nestingLevel === 0) {
      params.push(currentParam.trim());
      currentParam = "";
    } else {
      currentParam += char;
      if (char === "(" || char === "{" || char === "[") {
        nestingLevel++;
      } else if (char === ")" || char === "}" || char === "]") {
        nestingLevel--;
      }
    }
  }
  if (currentParam) {
    params.push(currentParam.trim());
  }
  return params;
}

// Function to modify recursive calls
function modifyRecursiveCalls(code) {
  const functionName = "fn";
  let result = "";
  let i = 0;

  while (i < code.length) {
    if (
      code.startsWith(functionName, i) &&
      /\bfn\b/.test(code.substring(i, i + functionName.length))
    ) {
      let j = i + functionName.length;
      while (code[j] && /\s/.test(code[j])) j++;
      if (code[j] === "(") {
        const start = j;
        let parenthesesCount = 1;
        j++;
        while (j < code.length && parenthesesCount > 0) {
          if (code[j] === "(") parenthesesCount++;
          else if (code[j] === ")") parenthesesCount--;
          j++;
        }
        const end = j;
        const originalArgs = code.substring(start + 1, end - 1);
        const paramList = splitParameters(originalArgs);
        const filteredParams = paramList.filter((param) => {
          const paramName = param.split("=")[0].trim();
          return (
            paramName !== "depthRecursionGraph" &&
            paramName !== "parentNodeRecursionGraph"
          );
        });
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

// Helper function to create parameter object string
function getParamsObjectString(paramsStr) {
  const paramList = splitParameters(paramsStr);
  const filteredParams = paramList.filter((param) => {
    const paramName = param.split("=")[0].trim();
    return (
      paramName !== "depthRecursionGraph" &&
      paramName !== "parentNodeRecursionGraph"
    );
  });
  const paramNames = filteredParams.map((param) => param.split("=")[0].trim());
  return `{ ${paramNames.join(", ")} }`;
}

// Update the function parameters with depthRecursionGraph and parentNodeRecursionGraph
function updateFunctionParameters(code) {
  return code.replace(/function\s+fn\s*\(([^)]*)\)/, (fullMatch, params) => {
    const paramList = splitParameters(params);
    const paramNames = paramList.map((param) => param.split("=")[0].trim());
    if (!paramNames.includes("depthRecursionGraph")) {
      paramList.push("depthRecursionGraph = 0");
    }
    if (!paramNames.includes("parentNodeRecursionGraph")) {
      paramList.push("parentNodeRecursionGraph = null");
    }
    const updatedParams = paramList.join(", ");
    return `function fn(${updatedParams})`;
  });
}

// Main function to modify the recursive function and add instrumentation
function modifyRecursiveFunction(code) {
  code = updateFunctionParameters(code);
  const functionName = "fn";
  const functionHeaderRegex = new RegExp(
    `function\\s+${functionName}\\s*\\(([^)]*)\\)\\s*{`
  );
  const headerMatch = code.match(functionHeaderRegex);
  if (!headerMatch) {
    Swal.fire("Error", "Function not found", "error");
    return code;
  }
  const functionParams = headerMatch[1];
  const functionStartIndex = headerMatch.index + headerMatch[0].length;
  let braceCount = 1;
  let currentIndex = functionStartIndex;
  while (braceCount > 0 && currentIndex < code.length) {
    const char = code[currentIndex];
    if (char === "{") braceCount++;
    else if (char === "}") braceCount--;
    currentIndex++;
  }
  const functionEndIndex = currentIndex;
  const functionBody = code.substring(functionStartIndex, functionEndIndex - 1);
  let modifiedFunctionBody = functionBody;
  modifiedFunctionBody =
    `const currentNode = createNode(${getParamsObjectString(
      functionParams
    )}, depthRecursionGraph);
    if (parentNodeRecursionGraph) parentNodeRecursionGraph.children.push(currentNode);` +
    modifiedFunctionBody;
  modifiedFunctionBody = modifyRecursiveCalls(modifiedFunctionBody);
  modifiedFunctionBody = modifiedFunctionBody.replace(
    /return\s+([^;]+);/g,
    (fullMatch, returnValue) => {
      return `const returnValueResult = ${returnValue};
    currentNode.returnValue = returnValueResult;
    return returnValueResult;`;
    }
  );

  return (
    code.substring(0, functionStartIndex) +
    modifiedFunctionBody +
    code.substring(functionEndIndex - 1)
  );
}

// Function to create and call the modified function with error handling
function createAndCallModifiedFunction(functionString, ...args) {
  try {
    recursionGraph = { nodes: [] };
    nodeId = 0;
    const modifiedFunction = new Function(`${functionString}\nreturn fn;`);
    const callableFunction = modifiedFunction();
    const result = callableFunction(...args);
    return recursionGraph;
  } catch (error) {
    Swal.fire("Compilation Error", error.message, "error");
  }
}
