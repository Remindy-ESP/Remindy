import Constants from 'expo-constants';

const getApiUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        return `http://${ip}:3000`;
    }
    return 'http://localhost:3000';
};

export const API_URL = getApiUrl();
