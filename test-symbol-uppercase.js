// Simple test script to verify that ART Contract symbols are always in uppercase

// Test cases
const testCases = [
  { name: "John Doe", expectedSymbol: "ARCJ" },
  { name: "alice", expectedSymbol: "ARCA" },
  { name: "Bob Smith", expectedSymbol: "ARCB" },
  { name: "123Test", expectedSymbol: "ARC1" },
  { name: " Space Test", expectedSymbol: "ARCS" }
];

// Function to simulate the symbol generation logic
function generateSymbol(name) {
  // Get the first letter of the first word in the name
  const initial = name.trim().charAt(0).toUpperCase();
  
  // Set symbol to ARC + initial (ensure it's all uppercase)
  return `ARC${initial}`.toUpperCase();
}

// Run tests
console.log("Testing ART Contract symbol generation:");
console.log("======================================");

let allPassed = true;

testCases.forEach((testCase, index) => {
  const generatedSymbol = generateSymbol(testCase.name);
  const passed = generatedSymbol === testCase.expectedSymbol;
  
  console.log(`Test ${index + 1}: Name = "${testCase.name}"`);
  console.log(`  Generated Symbol: ${generatedSymbol}`);
  console.log(`  Expected Symbol: ${testCase.expectedSymbol}`);
  console.log(`  Result: ${passed ? "PASSED" : "FAILED"}`);
  console.log("-------------------------------------");
  
  if (!passed) {
    allPassed = false;
  }
});

console.log(`Overall Result: ${allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}`);

// Test server-side validation
console.log("\nTesting server-side validation:");
console.log("======================================");

const serverValidationTests = [
  { symbol: "ARCJ", expectedValid: true },
  { symbol: "arcj", expectedValid: false },
  { symbol: "ArcJ", expectedValid: false },
  { symbol: "ARCJOHN", expectedValid: true }
];

serverValidationTests.forEach((test, index) => {
  const isValid = test.symbol === test.symbol.toUpperCase();
  const passed = isValid === test.expectedValid;
  
  console.log(`Validation Test ${index + 1}: Symbol = "${test.symbol}"`);
  console.log(`  Is Uppercase: ${isValid}`);
  console.log(`  Expected Valid: ${test.expectedValid}`);
  console.log(`  Result: ${passed ? "PASSED" : "FAILED"}`);
  console.log("-------------------------------------");
  
  if (!passed) {
    allPassed = false;
  }
});

console.log(`Final Result: ${allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}`);
