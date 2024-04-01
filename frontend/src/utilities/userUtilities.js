/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file userUtilities.js
 * This file contains utility functions for user-related operations. It allows users to get the username of a user,
 * get the user ID of the current user, ban a user, promote a user to moderator or admin, and demote a user from
 * moderator or admin.
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
 * Get details of the currently logged-in user.
 * @param {string[]} fields - List of user fields to retrieve (e.g., 'user_id', 'username', 'email')
 * @returns {Promise<object | null>} - User details object or null if an error occurs.
 */
async function getCurrentUserDetails(fields) {
    const authToken = localStorage.getItem("AuthToken");

    // No token means user is not logged in
    if (!authToken) return null;

    const response = await fetch(
        BACKENDURL + `users/me/?fields=${fields.join(',')}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
        }
    });

    // The token was invalid
    if (!response.ok) return null;

    const data = await response.json();
    return data["user"]; // Return only the 'user' portion of the data
}

/**
 * Get the user ID of the currently logged-in user.
 */
async function getCurrentUserId(){
    const userDetails = await getCurrentUserDetails(["user_id"]);
    return userDetails === null ? null : userDetails["user_id"];
}


async function banUser(userId){
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + `users/id/${userId}/ban/`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${auth_token}`
        }
    });
    return response.ok;
}

async function promoteToMod(userId){
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + `users/id/${userId}/promote/moderator/`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${auth_token}`
        }
    });
    return response.ok;
}

async function promoteToAdmin(userId){
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + `users/id/${userId}/promote/admin`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${auth_token}`
        }
    });
    return response.ok;
}

async function demoteMod(userId){
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + `users/id/${userId}/demote/moderator/`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${auth_token}`
        }
    });
    return response.ok;
}

async function demoteAdmin(userId){
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + `users/id/${userId}/demote/admin/`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${auth_token}`
        }
    });
    return response.ok;
}