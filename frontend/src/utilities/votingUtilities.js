/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file votingUtilities.js
 * This file contains utility functions for voting on posts. It allows users to vote on a post and get the vote of the
 * current user on a post.
 */

/**
 * Vote on a post
 * @param {Event} event
 * @param {number} postId - The ID of the post
 * @param {number} vote - 1 for upvote, -1 for downvote
 * @returns {Promise<void>}
 */
async function vote(event, postId, vote){
    // Prevent the site from reloading
    event.preventDefault(); // WHY DOES THIS NOT WORK?

    // Send the vote request
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "posts/id/" + postId + "/vote/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            },
            body: vote,
        });
}

/**
 * Get the vote of the current user on a post
 * @param {number} postId - The ID of the post
 * @returns {Promise<number>} - The vote of the current user
 */
async function getVoteOfCurrentUser(postId){
    // Send the GET request, send auth token
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "posts/id/" + postId + "/votes/user/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth_token}`
            }
        });
    const vote = await response.json();
    return response.ok ? vote : null;
}