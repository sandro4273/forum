/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file tagUtilities.js
 * This file contains utility functions for tag-related operations. It allows users to get tags for a post.
 */


/**
 * Get tags for a post
 * @param {number} post_id
 * @returns {Array}
 */
async function getTags(post_id){
    const response = await fetch(BACKENDURL + "posts/id/" + post_id + "/tags/");
    const tagsData = await response.json();
    const tags = tagsData["tags"];

    return tags;
}