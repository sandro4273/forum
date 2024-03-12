// Executed when chat.html is loaded
async function onLoad() {
    // Get partner username
    const chatId = getChatIdFromUrl();
    const chatData = await fetch(BACKENDURL + "chat/id/" + chatId + "/");
    const chat = await chatData.json();
    const user1Id = chat["result"]["user1"];
    const user2Id = chat["result"]["user2"];

    const currentUserId = await getCurrentUserId();

    // Must be logged in to access the chat
    if (!currentUserId) return;

    // Check if current user is permitted to access the chat
    const isChatPartner = await isUserChatPartner(currentUserId);
    if (!await isUserChatPartner(currentUserId)) return;

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
    const response = await fetch(BACKENDURL + "user/id/" + user_id + "/username/");
    const user = await response.json();
    return user["username"];
}

async function isUserChatPartner(userId) {
    const chatId = getChatIdFromUrl();
    const chatData = await fetch(BACKENDURL + "chat/id/" + chatId + "/");
    const chat = await chatData.json();
    const user1Id = chat["result"]["user1"];
    const user2Id = chat["result"]["user2"];

    return userId === user1Id || userId === user2Id;
}

async function getCurrentUserId() {
    const response = await fetch(
        BACKENDURL + "get_current_user_id/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
            }
        }
    );

    // If no user is logged in, return null
    if (!response.ok) return null;
    return await response.json();
}

async function loadMessages(chat_id) {
    const messageList = document.querySelector("#messageList");

    // Load all messages of chat
    const response = await fetch(BACKENDURL + "chat/id/" + chat_id + "/messages/all/");
    const messagesData = await response.json();
    const messages = messagesData["result"];

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

    // API request
    const body = {
        "user_id": 1, // Account-System noch nicht implementiert
        "message": message
    }
    const response = await fetch(
        BACKENDURL + "chat/id/" + chatId + "/create_message/", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });
    res = await response.json();
    return response;
}


// execute onLoad when page is fully loaded
window.addEventListener("DOMContentLoaded", onLoad());