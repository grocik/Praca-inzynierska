export const isUserAuthenticated = async () => {
    const accessToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('accessToken='))
      ?.split('=')[1];
  
    if (!accessToken) {
      return false;
    }
  
    try {
      const response = await fetch('http://localhost:7000/users/verify-token', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      const { isUserAuthenticated } = await response.json();
      return isUserAuthenticated;
    } catch (error) {
      console.error('Błąd weryfikacji tokenu:', error);
      throw error;
    }
  };