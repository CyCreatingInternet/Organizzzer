// Check authentication on project pages
function checkProjectAuth() {
    // Check if we have a valid user in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            if (userData && userData.id) {
                return true; // User is already authenticated
            }
        } catch (e) {
            console.error('Invalid stored user data:', e);
        }
    }

    // If no valid user found, redirect to main page
    window.location.href = 'index.html';
    return false;
}

// Export the function for use in project pages
window.checkProjectAuth = checkProjectAuth; 