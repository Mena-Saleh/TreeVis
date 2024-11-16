const algorithms = {
  Fibonacci: `function fn(n = 5) {
  if (n <= 1) {
    return n;
  }
  return fn(n - 1) + fn(n - 2);
}`,
  Factorial: `function fn(n = 3) {
  if (n <= 1) {
    return 1;
  }
  return n * fn(n - 1);
}`,
  "Merge Sort": `function fn(arr = [5, 2, 9, 1, 5, 6]) {
    if (arr.length <= 1){
    return arr;
    }

    const mid = Math.floor(arr.length / 2);
    const left = fn(arr.slice(0, mid));
    const right = fn(arr.slice(mid));

    return merge(left, right);
}

function merge(left, right) {
    let result = [];
    let i = 0, j = 0;

    while (i < left.length && j < right.length) {
        if (left[i] < right[j]) {
            result.push(left[i++]);
        } else {
            result.push(right[j++]);
        }
    }

    return result.concat(left.slice(i)).concat(right.slice(j));
}`,
  "Longest Common Subsequence (Memoized)": `var str1 = "ABC";
var str2 = "AEB";
var memo = {}; 

function fn(m = str1.length, n = str2.length) {
    let key = m + "," + n;

    if (m === 0 || n === 0){
    return 0;
    }

    if (key in memo){
    return memo[key];
    }

    if (str1[m - 1] === str2[n - 1]) {
        memo[key] = 1 + fn(m - 1, n - 1);
    } else {
        memo[key] = Math.max(fn(m - 1, n), fn(m, n - 1));
    }

    return memo[key];
}`,
  "Quick Sort": `function fn(arr = [3, 6, 8, 10, 1, 2, 1]) {
    if (arr.length <= 1) {
        return arr;
    }

    const pivot = arr[0];
    const left = [];
    const right = [];

    for (let i = 1; i < arr.length; i++) {
        if (arr[i] < pivot) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }

    const sortedLeft = fn(left);
    const sortedRight = fn(right);

    return sortedLeft.concat([pivot], sortedRight);
}`,
  "Fibonacci (Memoized)": `const memo = {};
function fn(n = 5) {
  if (n in memo) {
    return memo[n];
  }

  if (n <= 1) {
    memo[n] = n;
    return n;
  }

  memo[n] = fn(n - 1) + fn(n - 2);
  return memo[n];
}`,
  "Binary Search": `function fn(arr = [1, 3, 5, 7, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], target = 9, offset = 0) {
  if (arr.length === 0) {
    return -1;
  }

  const mid = Math.floor(arr.length / 2);
  const midValue = arr[mid];

  if (midValue === target) {
    return offset + mid;
  }

  if (target < midValue) {
    return fn(arr.slice(0, mid), target, offset);
  }

  else {
    const result = fn(arr.slice(mid + 1), target, offset + mid + 1);
    return result !== -1 ? result : -1;
  }
}`,
  "Tower Of Hanoi": `function fn(disks = 3, source = 'A', target = 'C', auxiliary = 'B') {
  if (disks === 1) {
    console.log(\`Move disk 1 from \${source} to \${target}\`);
    return;
  }

  fn(disks - 1, source, auxiliary, target);
  console.log(\`Move disk \${disks} from \${source} to \${target}\`);
  fn(disks - 1, auxiliary, target, source);
}`,
  GCD: `function fn(a = 48, b = 18) {
  if (b === 0) {
    return a;
  }

  return fn(b, a % b);
}`,
  "Palindrome Partitioning": `function fn(str = "aab", start = 0) {
  if (start >= str.length) {
    return [[]];
  }

  const result = [];

  for (let end = start; end < str.length; end++) {
    if (isPalindrome(str, start, end)) {
      const substr = str.substring(start, end + 1);
      const partitions = fn(str, end + 1);

      for (const partition of partitions) {
        result.push([substr].concat(partition));
      }
    }
  }

  return result;
}

function isPalindrome(str, left, right) {
  while (left < right) {
    if (str[left] !== str[right]) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}`,
  Custom: `// Define your global variables here
var x = "hello world"
// Main recursive function (do not change the name from fn)
function fn() {
    
}

// Define any helper functions you need here
`,
};
