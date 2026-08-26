export const checkSession = async (baseURL: string) => {

    try {
        const response = await fetch(`${baseURL}/auth/v1/session-info?includeDetails=true`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to check session');
        }

        const data = await response.json();
        return data.success && data.data.sessionActive;
    } catch (error) {
        console.error('Error checking session:', error);
        return false;
    }
}