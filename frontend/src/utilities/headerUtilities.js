/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file headerUtilities.js
 * This file contains utility functions for the header. It allows users to log in and log out. It also provides
 * functions to get user details and display the current user.
 */

// Stores user data in a cache to avoid unnecessary requests
const USER_CACHE = {};

/**
 * Toggle the display of the authentication buttons and the user info.
 */
function toggleAuthDisplay(isLoggedIn) {
    document.getElementById("authButtons").style.display = isLoggedIn ? "none" : "block";
    document.getElementById("loggedInUser").style.display = isLoggedIn ? "block" : "none";
}

/**
 * Checks the authentication status of the user.
 * @returns {Promise<Object|null>}
 */
async function checkAuthenticationStatus() {
    const authToken = localStorage.getItem("AuthToken");

    // No token means user is not logged in
    if (!authToken) return null;

    try {
        return await getCurrentUserDetails(["username", "email"]);
    } catch (error) { // Token is invalid, remove it from local storage
        localStorage.removeItem("AuthToken");
        return null;
    }
}

/**
 * Handles user authentication display:
 * - Checks for logged-in status.
 * - Displays user info or authentication buttons accordingly.
 */
async function displayAuthStatus() {
    const userDetails = await checkAuthenticationStatus();
    const isLoggedIn = userDetails !== null;

    toggleAuthDisplay(isLoggedIn); // Update UI visibility

    // If user is logged in, display user info. If not we're done.
    if (!isLoggedIn) return;

    const { username, email } = userDetails;

    // Display the user info
    document.getElementById("username").textContent = username;
    document.getElementById("email").textContent = email;

    // Add event listener to the logout button
    document.getElementById("logoutButton").addEventListener("click", logout);
}

/**
 * Returns the username, user role, and role color of a user.
 * @param {number} user_id - The ID of the user
 * @returns {Promise<{username: string, userRole: string, roleColor: string}>}
 */
async function getUserDetails(user_id) {
    // Check if the user is already in the cache
    if (user_id in USER_CACHE) return USER_CACHE[user_id];

    const response = await fetch(`${BACKENDURL}users/id/${user_id}/?fields=username,role`);
    const data = await response.json();

    const username = data["user"]["username"];
    const userRole = data["user"]["role"];
    const roleColor = getRoleColor(userRole);
    const userDetails = { username, userRole, roleColor };

    // Add the user to the cache
    USER_CACHE[user_id] = userDetails;

    return userDetails;
}

/**
 * Logs out the user by removing the token from the local storage
 */
async function logout(){
    localStorage.removeItem("AuthToken");
    window.location.reload(); // Reload the page to update the header
}
