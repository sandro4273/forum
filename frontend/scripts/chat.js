// Executed when chat.html is loaded
async function onLoad() {
    // Get partner username
    const chatId = getChatIdFromUrl();
    const chatResponse = await fetch(BACKENDURL + "chat/id/" + chatId + "/");
    const chatData = await chatResponse.json();
        console.log(chatData);
    const chat = chatData["chat"];
    const user1Id = chat["user1"];
    const user2Id = chat["user2"];

    // Must be logged in to access the chat
    const currentUserId = await getCurrentUserId();

    if (!currentUserId) return;

    // Check if current user is permitted to access the chat
    if (!(currentUserId === user1Id || currentUserId === user2Id)) return;

    // Get partner id
    const partnerId = currentUserId === user1Id ? user2Id : user1Id;

    // Set chat title
    const partnerUsername = await getUsernameById(partnerId);
    const chatTitle = document.querySelector("#chatTitle");
    chatTitle.textContent = "Chat mit " + partnerUsername

    // Add event listener to send message button and load messages
    document.querySelector("#sendMessage").addEventListener("click", sendMessage);
    await loadMessages(chatId);
}

function getChatIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function getUsernameById(user_id) {
    const usernameResponse = await fetch(BACKENDURL + "user/id/" + user_id + "/username/");
    const usernameData = await usernameResponse.json();
    return usernameData["username"];
}

async function getCurrentUserId() {
    const auth_token = localStorage.getItem("AuthToken");
    const response = await fetch(
        BACKENDURL + "get_current_user_id/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth_token}`
            }
        }
    );

    // If no user is logged in, return null
    if (!response.ok) return null;

    const user = await response.json();
    return user["user_id"]; // Return user ID of logged in user
}

async function loadMessages(chat_id) {
    const messageList = document.querySelector("#messageList");
    messageList.innerHTML = ""; // Clear message list

    // Load all messages of chat
    const messagesResponse = await fetch(BACKENDURL + "chat/id/" + chat_id + "/messages/all/");
    const messagesData = await messagesResponse.json();
    const messages = messagesData["messages"];

    // Create HTML elements for each message and append them
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];

        // get username of sender
        const sentById = message["sent_by"];
        const username = await getUsernameById(sentById);

        // Create a container for the comment
        const messageContainer = document.createElement('div');

        // Display creation time (in gray)
        const timestampElement = document.createElement('span');
        timestampElement.textContent = message["created_at"];
        timestampElement.style.color = "gray";
        messageContainer.appendChild(timestampElement);

        // Display user ID
        const usernameElement = document.createElement('span');
        usernameElement.textContent = " - " + username + ": ";
        messageContainer.appendChild(usernameElement);

        // Display comment content
        const msgContentElement = document.createElement('span');
        msgContentElement.textContent = message["message"];
        messageContainer.appendChild(msgContentElement);

        // Append the comment container to the comment list
        messageList.appendChild(messageContainer);
    }

}

async function sendMessage(event) {
    event.preventDefault();

    // Extract chatId and message content
    const chatId = getChatIdFromUrl();
    const messageContent = document.querySelector("#messageContent");
    const message = messageContent.value.trim();

    // API request to create message
    const currentUserId = await getCurrentUserId();
    const body = {
        "user_id": currentUserId,
        "message": message
    }

    const messageResponse = await fetch(
        BACKENDURL + "chat/id/" + chatId + "/create_message/", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });

    const messageData = await messageResponse.json();

    //Reload all messages and clear input field
    await loadMessages(chatId);
    messageContent.value = "";

    return messageData;
}


// execute onLoad when page is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());