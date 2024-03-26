/**
 * @file userUtilities.js
 * This file contains utility functions for user-related operations.
 */

/**
 * Get the username of a user
 * @param {number} userId - The ID of the user
 * @returns {string} - The username of the user or null if the user does not exist
 */
async function getUsername(userId){
    const response = await fetch(BACKENDURL + `users/id/${userId}/?field=username`);
    const data = await response.json();
    return response.ok ? data["user"]["username"] : null;
}

/**
 * Get the user ID of the current user
 * @returns {number} - The user ID of the current user or null if the user is not logged in
 */
async function getCurrentUserId(){
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + `users/me/?fields=user_id`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth_token}`
        }
    });
    const data = await response.json();

    return response.ok ? data["user"]["user_id"] : null;
}