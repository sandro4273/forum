/**
 * Programmierprojekt Forum, 2024-04-01
 * Luca Flühler, Lucien Ruffet, Sandro Kuster
 *
 * @file roleUtilities.js
 * This file contains utility functions for managing user roles and permissions.
 */

// Maps roles to permissions.
const roles = {
    admin: {
        // User permissions
        canBanUser: true,
        canPromoteToMod: true,
        canPromoteToAdmin: true,
        canDemoteMod: true,
        canDemoteAdmin: false,
        
        // Post and Comment permissions
        canCreateContent: true,
        canEditContent: false,
        canDeleteContent: true
    },
    moderator: {
        // User permissions
        canBanUser: true,
        canPromoteToMod: false,
        canPromoteToAdmin: false,
        canDemoteMod: false,
        canDemoteAdmin: false,

        // Post and Comment permissions
        canCreateContent: true,
        canEditContent: false,
        canDeleteContent: true
    },
    user: {
        // User permissions
        canBanUser: false,
        canPromoteToMod: false,
        canPromoteToAdmin: false,
        canDemoteMod: false,
        canDemoteAdmin: false,

        // Post and Comment permissions
        canCreateContent: true,
        canEditContent: false,
        canDeleteContent: false
    },
    guest: {
        // User permissions
        canBanUser: false,
        canPromoteToMod: false,
        canPromoteToAdmin: false,
        canDemoteMod: false,
        canDemoteAdmin: false,

        // Post and Comment permissions
        canCreateContent: false,
        canEditContent: false,
        canDeleteContent: false
    },
    banned: {
        // User permissions
        canBanUser: false,
        canPromoteToMod: false,
        canPromoteToAdmin: false,
        canDemoteMod: false,
        canDemoteAdmin: false,

        // Post and Comment permissions
        canCreateContent: false,
        canEditContent: false,
        canDeleteContent: false
    }
};

// Maps roles to colors.
const colors = {
    "admin": "red",
    "moderator": "green",
    "user": "blue"
}

/**
 * Returns the role of a user.
 * @param {number} user_id - The user's ID.
 * @returns {string} The role of the user or "guest" if the user is not logged in.
 */
async function getRole(user_id){
    // Return guest role if user_id null
    if (!user_id) {
        return "guest";
    }

    // Get the role of the user with the given user_id.
    const response = await fetch(`${BACKENDURL}users/id/${user_id}/?fields=role`);
    const data = await response.json();
    return data["user"]["role"];
}

/**
 * Returns the color associated with a role.
 * @param {string} role - The role.
 * @returns {string} The color associated with the role.
 */
function getRoleColor(role){
    return colors[role];
}

/**
 * Returns a div containing a "..." button and a set of action buttons based on the user's role.
 * The action buttons are initially hidden and are shown or hidden when the "..." button is clicked.
 * @param {string} role - The user's role.
 * @returns {HTMLElement} The div containing the "..." button and the action buttons.
 */
function getUserManagementButtons(managerRole, authorRole) {
    // Create the main div.
    const div = document.createElement('div');
    div.style.display = 'inline-block';

    // Get the permissions for the manager's role.
    const rolePermissions = roles[managerRole];

    // Create the "..." button.
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '...';

    // Create the div for the action buttons and hide it by default.
    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'none';
    div.appendChild(actionsDiv);

    // Add a click event listener to the "..." button that toggles the visibility of the action buttons.
    toggleButton.addEventListener('click', () => {
        actionsDiv.style.display = actionsDiv.style.display === 'none' ? 'inline-block' : 'none';
    });

    // Create the action buttons based on the manager's permissions and add them to the actions div.
    if (rolePermissions.canBanUser && authorRole === 'user') {
        const banButton = document.createElement('button');
        banButton.textContent = 'Nutzer sperren';
        banButton.classList.add('banButton');
        actionsDiv.appendChild(banButton);
    }

    if (rolePermissions.canPromoteToMod && authorRole === 'user') {
        const promoteToModButton = document.createElement('button');
        promoteToModButton.textContent = 'zu Moderator machen';
        promoteToModButton.classList.add('promoteToModButton');
        actionsDiv.appendChild(promoteToModButton);
    }

    if (rolePermissions.canPromoteToAdmin && (authorRole === 'user' || authorRole === 'moderator')) {
        const promoteToAdminButton = document.createElement('button');
        promoteToAdminButton.textContent = 'zu Admin machen';
        promoteToAdminButton.classList.add('promoteToAdminButton');
        actionsDiv.appendChild(promoteToAdminButton);
    }

    if (rolePermissions.canDemoteMod && authorRole === 'moderator') {
        const demoteModButton = document.createElement('button');
        demoteModButton.textContent = 'zu Nutzer herabstufen';
        demoteModButton.classList.add('demoteModButton');
        actionsDiv.appendChild(demoteModButton);
    }

    if (rolePermissions.canDemoteAdmin && authorRole === 'admin') {
        const demoteAdminButton = document.createElement('button');
        demoteAdminButton.textContent = 'zu Moderator herabstufen';
        demoteAdminButton.classList.add('demoteAdminButton');
        actionsDiv.appendChild(demoteAdminButton);
    }

    // If any action buttons were added, append the toggle button and the actions div to the main div.
    if (actionsDiv.hasChildNodes()) {
        div.appendChild(toggleButton);
        div.appendChild(actionsDiv);
    }

    // Return the main div.
    return div;
}


/**
 * Returns a div containing a "..." button and a set of content management buttons based on the user's role.
 * The content management buttons are initially hidden and are shown or hidden when the "..." button is clicked.
 * @param {string} role - The user's role.
 * @returns {HTMLElement} The div containing the "..." button and the content management buttons.
 */
function getContentManagementButtons(managerRole, authorRole, isAuthor) {
    // Create the main div.
    const div = document.createElement('div');
    div.style.display = 'inline-block';

    // Get the permissions for the role.
    const rolePermissions = roles[managerRole];

    // Create the "..." button.
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '...';    

    // Create the div for the content management buttons and hide it by default.
    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'none';
    div.appendChild(actionsDiv);

    // Add a click event listener to the "..." button that toggles the visibility of the content management buttons.
    toggleButton.addEventListener('click', () => {
        actionsDiv.style.display = actionsDiv.style.display === 'none' ? 'inline-block' : 'none';
    });

    // Create the content management buttons based on the manager's permissions and add them to the actions div.
    if (isAuthor || rolePermissions.canEditContent) {
    const editContentButton = document.createElement('button');
    editContentButton.textContent = 'Bearbeiten';
    editContentButton.classList.add('editContentButton');
    actionsDiv.appendChild(editContentButton);

    const submitEditContentButton = document.createElement('button');
    submitEditContentButton.textContent = 'Speichern';
    submitEditContentButton.classList.add('submitEditContentButton');
    submitEditContentButton.style.display = 'none';
    actionsDiv.appendChild(submitEditContentButton);
    }

    if (isAuthor || (rolePermissions.canDeleteContent && (managerRole === 'admin' || (authorRole !== 'admin' && authorRole !== 'mod')))) {
    const deleteContentButton = document.createElement('button');
    deleteContentButton.textContent = 'Löschen';
    deleteContentButton.classList.add('deleteContentButton');
    actionsDiv.appendChild(deleteContentButton);
    }

    // If any content management buttons were added, append the toggle button and the actions div to the main div.
    if (actionsDiv.hasChildNodes()) {
        div.appendChild(toggleButton);
        div.appendChild(actionsDiv);
    }

    // Return the main div.
    return div;
}