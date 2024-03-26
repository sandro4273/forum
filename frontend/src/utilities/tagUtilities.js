/**
 * @file tagUtilities.js
 * This file contains utility functions for tag-related operations.
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