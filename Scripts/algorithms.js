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
  MergeSort: `function fn(arr = [5, 2, 9, 1, 5, 6]) {
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
  LongestCommonSubsequence: `str1 = "ABC";
str2 = "AEB";
function fn( m = str1.length, n = str2.length) {
    if (m === 0 || n === 0){
    return 0;
    }
    if (str1[m - 1] === str2[n - 1]) {
        return 1 + fn(m - 1, n - 1);
    } else {
        return Math.max(fn(m - 1, n), fn(m, n - 1));
    }
}
`,
  QuickSort: `function fn(arr = [3, 6, 8, 10, 1, 2, 1]) {
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
  FibonacciMemo: `const memo = {};
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
  BinarySearch: `function fn(arr = [1, 3, 5, 7, 9], target = 5, left = 0, right = arr.length - 1) {
  if (left > right) {
    return -1;
  }

  const mid = Math.floor((left + right) / 2);

  if (arr[mid] === target) {
    return mid;
  }

  if (arr[mid] > target) {
    return fn(arr, target, left, mid - 1);
  }

  return fn(arr, target, mid + 1, right);
}`,
  TowerOfHanoi: `function fn(disks = 3, source = 'A', target = 'C', auxiliary = 'B') {
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
  PalindromePartitioning: `function fn(str = "aab", start = 0) {
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
