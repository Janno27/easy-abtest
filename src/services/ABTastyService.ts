import axios from 'axios';

const ABTASTY_AUTH_URL = 'https://api.abtasty.com/oauth/token';

interface AuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export const authenticateABTasty = async (clientId: string, clientSecret: string): Promise<AuthResponse> => {
  const response = await axios.post(ABTASTY_AUTH_URL, {
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  });

  return response.data;
};
