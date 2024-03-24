// TODO: File is a mess

// Global variables
let currentUsername = null;
let currentUserRole = null;

let authorUsername = null;

let editPostVisible = false;

// Rich Text Editor
const commentQuill = new Quill('#createCommentEditor', quillSettingsComment);
let postQuill = null;

// Funktion wird ausgeführt wenn Seite geladen ist
async function onLoad(){
    const postId = getPostIdFromUrl();

    // Load user data
    const currentUserId = await getCurrentUserId();
    if(currentUserId){
        currentUsername = await getUsername(currentUserId);
        currentUserRole = await getRole(currentUserId);
    }
    console.log("Logged in as: " + currentUsername)

    // Load post data
    const post = await getPost(postId);
    const authorId = post["author_id"];
    authorUsername = await getUsername(authorId);

    // Add event listeners
    document.querySelector("#upvoteButton").addEventListener("click", (event) => vote(event, postId, 1));
    document.querySelector("#downvoteButton").addEventListener("click", (event) => vote(event, postId, -1));

    document.querySelector("#submitComment").addEventListener("click", (event) => createComment(event, postId));

    // Load post, tags and comments
    await configureUIElements(currentUserId, authorId);
    await displayPost(post);
    await loadTags(postId);
    await displayVotes(postId, currentUserId);
    await displayComments(postId);
}

async function configureUIElements(currentUserId, postAuthorId){
    // If a user is logged in, display the comment form and vote buttons
    const commentForm = document.getElementById('commentForm');
    commentForm.style.display = currentUserId ? 'block' : 'none';

    const upvoteButton = document.getElementById('upvoteButton');
    const downvoteButton = document.getElementById('downvoteButton');
    upvoteButton.style.display = currentUserId ? 'inline-block' : 'none';  
    downvoteButton.style.display = currentUserId ? 'inline-block' : 'none';

    // If the user is the author create edit post editor
    if (currentUserId === postAuthorId){
        postQuill = new Quill('#editPostEditor', quillSettingsPost);
    }

    // Post Management Buttons
    const container = document.getElementById('postManagementButtonsContainer');
    const authorRole = await getRole(postAuthorId);
    const postManagementButtons = getContentManagementButtons(currentUserRole, authorRole, currentUserId === postAuthorId);
    container.appendChild(postManagementButtons);

    // Add event listeners to the post management buttons if they exist
    const editButton = postManagementButtons.querySelector(".editContentButton");
    const submitEditButton = postManagementButtons.querySelector(".submitEditContentButton");
    const deleteButton = postManagementButtons.querySelector(".deleteContentButton");

    editButton && editButton.addEventListener("click", () => toggleEditPost(postId));
    submitEditButton && submitEditButton.addEventListener("click", () => submitEditPostFunction(postId));
    deleteButton && deleteButton.addEventListener("click", () => deletePost(postId));
}

async function displayPost(post){
    // load title and content
    const postTitle = post["title"];
    const postContent = post["content"];

    // load author and role
    const authorId = post["author_id"];
    const authorRole = await getRole(authorId);
    const roleColor = getRoleColor(authorRole);
    
    // insert post into HTML
    document.querySelector("#postTitle").innerHTML = `${postTitle}  ---  ${authorUsername} <span style="color: ${roleColor}">(${authorRole})</span>`;
    document.querySelector("#postContent").innerHTML = postContent;
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

async function displayComments(post_id){
    // load comments
    const response = await fetch(BACKENDURL + "posts/id/" + post_id + "/comments/");
    const commentsData = await response.json();
    const comments = commentsData["comments"];

    // Create Comment objects for each comment
    let commentObjects = [];
    for(let i = 0; i < comments.length; i++){
        // Create comment object
        const comment = comments[i];
        const commentObject = new Comment();
        await commentObject.init(comment["comment_id"], comment["content"], comment["author_id"], comment["post_id"], comment["created_at"]);
        commentObjects.push(commentObject);

        // Insert comment into HTML
        document.querySelector("#commentList").appendChild(commentObject.commentContainer);
    }
}

async function toggleEditPost(){
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

// execute onLoad when page is loaded
window.addEventListener("DOMContentLoaded", onLoad());
