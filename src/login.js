// Function to handle form submission
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");
  
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      await submitLogin(username, password, loginError);
    });
  });
  
  // Function to submit login credentials
  async function submitLogin(username, password, loginError) {
    const authHeader = `${username}:${password}`;
    const encodedAuth = btoa(authHeader);
  
    try {
      const response = await fetch("https://learn.reboot01.com/api/auth/signin", {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodedAuth}`,
          "Content-Type": "application/json",
        },
      });
  
      if (response.ok) {
        const responseData = await response.json();
        storeToken(responseData);
        window.location.href = "profile.html"; // Redirect to profile page
      } else {
        // Handle specific HTTP errors
        if (response.status === 404) {
          loginError.textContent = "The login endpoint is not found. Please try again later.";
        } else if (response.status === 401) {
          loginError.textContent = "Invalid username or password.";
        } else {
          loginError.textContent = "Something went wrong. Please try again later.";
        }
      }
    } catch (error) {
      // Handle connection errors
      loginError.textContent = "Connection error, please try again later.";
    }
  }
  
  
  // Function to store the token in local storage
  function storeToken(token) {
    localStorage.setItem("token", token);
  }
