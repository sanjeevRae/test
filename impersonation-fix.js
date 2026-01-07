// Simple impersonation fix
// Replace the handleImpersonateUser function in ControlsDashboard.jsx

const handleImpersonateUser = async (userId) => {
  try {
    const result = await impersonateUser(userId);
    if (result.success) {
      // Store impersonation info in sessionStorage
      sessionStorage.setItem('impersonationMode', 'true');
      sessionStorage.setItem('impersonatedUserId', userId);
      sessionStorage.setItem('impersonatedUserData', JSON.stringify(result.userData));
      sessionStorage.setItem('superAdminId', auth.currentUser.uid);
      sessionStorage.setItem('superAdminEmail', auth.currentUser.email);
      
      alert(`Successfully impersonating ${result.userData.email}. Redirecting to their dashboard...`);
      
      // Use window.location to force navigation
      window.location.href = '/dashboard';
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Error impersonating user:', error);
    alert('Failed to impersonate user');
  }
};