// Programmierprojekt Forum, 06.03.2024
// Luca Flühler, Lucien Ruffet, Sandro Kuster
// Beschreibung: Hauptseite des Forums

/**
 * @file post.js
 * This file contains the logic for the post page.
 * It displays a post, its tags and comments, and allows users to vote on the post, comment on the post, and edit the post.
 */

let editPostVisible = false;

// gets executed when the page is loaded
async function onLoad(){
    // Load post data
    const postId = getPostIdFromUrl();
    const post = await getPost(postId);
    const authorId = post["author_id"];

    // Load user data
    const currentUserId = await getCurrentUserId();
    const currentUsername = await getUsername(currentUserId);
    console.log("Logged in as: " + currentUsername)

    // Load page elements
    await configureUIElements(currentUserId, post);
    await displayPost(post);
    await displayTags(postId);
    await displayVotes(postId, currentUserId);
    await displayComments(postId, currentUserId);
}

async function configureUIElements(currentUserId, post){
    // If a user is logged in, display the comment form and create Rich Text Editor for comments
    const commentForm = document.getElementById('commentForm');
    if (currentUserId){
        commentForm.style.display = currentUserId ? 'block' : 'none';
        
        // Rich Text Editor for creating comments
        const commentQuill = new Quill('#createCommentEditor', quillSettingsComment);
        document.querySelector("#submitComment").addEventListener("click", (event) => createComment(event, post["post_id"], 
        document.querySelector("#createCommentEditor").querySelector(".ql-editor").innerHTML));
    }

    // If the user is the author, create edit post editor
    if (currentUserId === post["author_id"]){
        postQuill = new Quill('#editPostEditor', quillSettingsPost);
    }
    
    // Display and configure vote buttons
    const upvoteButton = document.getElementById('upvoteButton');
    const downvoteButton = document.getElementById('downvoteButton');
    upvoteButton.style.display = currentUserId ? 'inline-block' : 'none';  
    downvoteButton.style.display = currentUserId ? 'inline-block' : 'none';

    document.querySelector("#upvoteButton").addEventListener("click", (event) => vote(event, post["post_id"], 1));
    document.querySelector("#downvoteButton").addEventListener("click", (event) => vote(event, post["post_id"], -1));

    // Create Post Management Buttons
    const container = document.getElementById('postManagementButtonsContainer');

    const currentUserRole = await getRole(currentUserId);
    const authorRole = await getRole(post["author_id"]);

    const postManagementButtons = getContentManagementButtons(currentUserRole, authorRole, currentUserId === post["author_id"]);
    container.appendChild(postManagementButtons);

    // Add event listeners to the post management buttons if they exist
    const editButton = postManagementButtons.querySelector(".editContentButton");
    const submitEditButton = postManagementButtons.querySelector(".submitEditContentButton");
    const deleteButton = postManagementButtons.querySelector(".deleteContentButton");

    editButton && editButton.addEventListener("click", () => toggleEditPost(post));
    submitEditButton && submitEditButton.addEventListener("click", () => submitEditPostFunction(post["post_id"], document.querySelector("#post")));
    deleteButton && deleteButton.addEventListener("click", () => deletePost(post["post_id"]));
}

async function displayPost(post){
    // load title and content
    const postTitle = post["title"];
    const postContent = post["content"];

    // load author and role
    const authorId = post["author_id"];
    const authorUsername = await getUsername(authorId);
    const authorRole = await getRole(authorId);
    const roleColor = getRoleColor(authorRole);
    
    // insert post into HTML
    document.querySelector("#postTitle").innerHTML = `${postTitle}  ---  ${authorUsername} <span style="color: ${roleColor}">(${authorRole})</span>`;
    let postElement = document.querySelector("#postContent")
    postElement.innerHTML = postContent;

    renderMathJax(postElement)
}

async function displayTags(postId){
    // Get tags of the post
    const tags = await getTags(postId);
    
    // Get the place to insert the tags
    const tagList = document.querySelector("#tags");

    // Check if there are any tags
    if (tags.length === 0){
        tagList.style.display = "none";
        return;
    }

    // Create HTML elements for each tag and insert them
    for(let i = 0; i < tags.length; i++){
        const tagElement = document.createElement('span');
        tagElement.textContent = tags[i];
        tagElement.style.border = "1px solid black";
        tagElement.style.padding = "2px";
        tagElement.style.margin = "3px";
        tagList.appendChild(tagElement);

        // TODO: Add event listener to tagElement so that it redirects to a search for the tag
    }
}

async function displayVotes(postId, currentUserId){
    const voteCount = document.querySelector("#voteCount");
    const upvoteButton = document.querySelector("#upvoteButton");
    const downvoteButton = document.querySelector("#downvoteButton");

    // Load votes
    const response = await fetch(BACKENDURL + "posts/id/" + postId + "/votes/");
    const votes = await response.json() || 0;

    // Display vote count
    voteCount.textContent = votes;

    // Display the vote of the current user
    if(currentUserId){
        const vote = await getVoteOfCurrentUser(postId);
        if(vote){
            if(vote === 1){
                upvoteButton.style.backgroundColor = "green";
            } else if(vote === -1){
                downvoteButton.style.backgroundColor = "red";
            }
        }
    }
}

function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function displayComments(post_id, currentUserId){
    // load comments
    const commentsArray = await getComments(post_id);
    
    // Create Comment divs for each comment
    for(let i = 0; i < commentsArray.length; i++){
        const comment = commentsArray[i];
        // Create comment div
        const commentDiv = await createCommentDiv(comment, currentUserId);

        // Insert buttons for user and content management
        await insertButtons(commentDiv, currentUserId, comment["author_id"]);

        // Insert comment into HTML
        document.querySelector("#commentList").appendChild(commentDiv);
    }
    // Render MathJax
    renderMathJax(commentList)
}

async function toggleEditPost(post){
    editPostVisible = !editPostVisible;
    // Get the post content
    const postContent = post["content"];

    // Toggle the post content
    const postContentElement = document.querySelector("#postContent");
    postContentElement.style.display = editPostVisible ? "none" : "block";

    // Toggle text editor with the post content
    const editPostDiv = document.querySelector("#editPost");
    editPostDiv.style.display = editPostVisible ? "block" : "none";
    postQuill.root.innerHTML = postContent;

    // Toggle text of "bearbeiten" button
    const editPostButton = document.querySelector("#postManagementButtonsContainer").querySelector(".editContentButton");
    if(editPostButton){
        editPostButton.textContent = editPostVisible ? "Zurück" : "Bearbeiten";
    }
    
    // Toggle submit button
    const submitEditPost = document.querySelector("#postManagementButtonsContainer").querySelector(".submitEditContentButton");
    submitEditPost.style.display = editPostVisible ? "inline-block" : "none";
}

/**
* Render MathJax in a given element. Requires MathJax to be loaded.
* @param element The element in which MathJax should be rendered.
*/
function renderMathJax(element){
    // Check if MathJax is loaded
    if (!window.MathJax || !element) return;

    // Tell MathJax to update the document
    MathJax.typesetPromise([element])
        .catch(function (err) {
            console.error('MathJax rendering error: ' + err);
        });
}
  
// execute onLoad when page is loaded
window.addEventListener("DOMContentLoaded", onLoad());
