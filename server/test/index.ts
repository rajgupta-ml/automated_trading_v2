import axios, { type AxiosRequestConfig } from "axios";

const URI = "http://localhost:8080/api";

// Test data
const mockUser = {
  username: "rajgupta",
  password: "12345677",
  newPassword: "newpassword123",
  apiKey: "test-api-key",
  apiSecret: "test-api-secret",
  redirectUri: "http://localhost:3000/callback"
};

let authToken = ""; // Store JWT token for authenticated requests

// 1. Signup Test
const signup = async () => {
  console.log("\n🔐 Testing Signup...");
  const data = {
    username: mockUser.username,
    password: mockUser.password,
  };

  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.post(`${URI}/auth/v1/signup`, data, config);
    console.log("✅ Signup successful:", response.data);
    return true;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Signup failed:", error.response?.data || error.message);
    } else {
      console.error("❌ Unexpected error:", error);
    }
    return false;
  }
};

// 2. Login Test
const login = async () => {
  console.log("\n🔑 Testing Login...");
  const data = {
    username: mockUser.username,
    password: mockUser.password,
  };

  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.post(`${URI}/auth/v1/login`, data, config);
    console.log("✅ Login successful:", response.data);
    
    // Extract token if returned (modify based on your actual response structure)
    if (response.data.token) {
      authToken = response.data.token;
      console.log("🎫 Token stored for authenticated requests");
    }
    return true;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Login failed:", error.response?.data || error.message);
    } else {
      console.error("❌ Unexpected error:", error);
    }
    return false;
  }
};

// 3. Update User Test
const updateUser = async () => {
  console.log("\n✏️ Testing User Update...");
  const data = {
    username: mockUser.username,
    password: mockUser.newPassword, // Update password
    apiKey: mockUser.apiKey,
    apiSecret: mockUser.apiSecret,
    redirectUri: mockUser.redirectUri
  };

  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}` // Add auth token
    }
  };


  try {
    const response = await axios.put(`${URI}/auth/v1/update`, data, config);
    console.log("✅ Update successful:", response.data);
    
    // Update local password for future tests
    mockUser.password = mockUser.newPassword;
    return true;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Update failed:", error.response?.data || error.message);
    } else {
      console.error("❌ Unexpected error:", error);
    }
    return false;
  }
};

// 4. Login with Updated Password Test
const loginWithUpdatedPassword = async () => {
  console.log("\n🔑 Testing Login with Updated Password...");
  const data = {
    username: mockUser.username,
    password: mockUser.password, // Now using the updated password
  };

  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.post(`${URI}/auth/v1/login`, data, config);
    console.log("✅ Login with updated password successful:", response.data);
    
    // Update token if returned
    if (response.data.token) {
      authToken = response.data.token;
    }
    return true;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Login with updated password failed:", error.response?.data || error.message);
    } else {
      console.error("❌ Unexpected error:", error);
    }
    return false;
  }
};

// 5. Delete User Test
const deleteUser = async () => {
  console.log("\n🗑️ Testing User Deletion...");
  const data = {
    username: mockUser.username,
  };

  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}` // Add auth token
    }
  };

  try {
    const response = await axios.delete(`${URI}/auth/v1/delete`, {
      ...config,
      data // Axios delete method requires data in config
    });
    console.log("✅ Delete successful:", response.data);
    return true;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Delete failed:", error.response?.data || error.message);
    } else {
      console.error("❌ Unexpected error:", error);
    }
    return false;
  }
};

// 6. Login After Deletion Test (Should Fail)
const loginAfterDeletion = async () => {
  console.log("\n🚫 Testing Login After Deletion (Should Fail)...");
  const data = {
    username: mockUser.username,
    password: mockUser.password,
  };

  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.post(`${URI}/auth/v1/login`, data, config);
    console.log("❌ Login after deletion should have failed but succeeded:", response.data);
    return false;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.log("✅ Login after deletion correctly failed:", error.response?.data || error.message);
      return true;
    } else {
      console.error("❌ Unexpected error:", error);
      return false;
    }
  }
};

// Error Test Cases
const testInvalidLogin = async () => {
  console.log("\n❌ Testing Invalid Login...");
  const data = {
    username: "nonexistentuser",
    password: "wrongpassword",
  };

  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json"
    }
  };

  try {
    const response = await axios.post(`${URI}/auth/v1/login`, data, config);
    console.log("❌ Invalid login should have failed but succeeded:", response.data);
    return false;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.log("✅ Invalid login correctly failed:", error.response?.data || error.message);
      return true;
    } else {
      console.error("❌ Unexpected error:", error);
      return false;
    }
  }
};

const testUnauthorizedUpdate = async () => {
  console.log("\n🚫 Testing Unauthorized Update...");
  const data = {
    username: "testuser",
    password: "newpassword",
  };

  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json"
      // Intentionally not including Authorization header
    }
  };

  try {
    const response = await axios.put(`${URI}/auth/v1/update`, data, config);
    console.log("❌ Unauthorized update should have failed but succeeded:", response.data);
    return false;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.log("✅ Unauthorized update correctly failed:", error.response?.data || error.message);
      return true;
    } else {
      console.error("❌ Unexpected error:", error);
      return false;
    }
  }
};

// Main test runner
const runAllTests = async () => {
  console.log("🚀 Starting Auth API Tests...");
  console.log("================================");

  const results = {
    signup: false,
    login: false,
    update: false,
    loginWithUpdatedPassword: false,
    delete: false,
    loginAfterDeletion: false,
    invalidLogin: false,
    unauthorizedUpdate: false
  };

  // Run tests in sequence
  results.signup = await signup();
  results.login = await login();
  results.update = await updateUser();
  results.loginWithUpdatedPassword = await loginWithUpdatedPassword();
  results.delete = await deleteUser();
  results.loginAfterDeletion = await loginAfterDeletion();
  
  // Error case tests
  results.invalidLogin = await testInvalidLogin();
  results.unauthorizedUpdate = await testUnauthorizedUpdate();

  // Summary
  console.log("\n📊 Test Results Summary:");
  console.log("========================");
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log("🎉 All tests passed! Your Auth API is working correctly.");
  } else {
    console.log("⚠️ Some tests failed. Please check your API implementation.");
  }
};

// Run the tests
runAllTests().catch(console.error);