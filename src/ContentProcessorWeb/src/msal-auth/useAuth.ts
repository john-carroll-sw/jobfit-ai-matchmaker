import { useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus, AccountInfo } from "@azure/msal-browser";

import { msalInstance } from "./msalInstance";
import { loginRequest, tokenRequest } from "./msaConfig";


interface User {
  username: string;
  name: string | undefined;
  shortName?: string;
  isInTeams: boolean;
}

const useAuth = () => {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState<User | null>(null);

  const { inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [token, setToken] = useState<string | null>(null);

  const activeAccount: AccountInfo | undefined = accounts[0];

  useEffect(() => {
    if (accounts.length > 0) {
      setUser({
        username: accounts[0].username,
        name: accounts[0]?.name,
        //shortName: getShortName(accounts?[0].name),
        isInTeams: false
      });
      instance.setActiveAccount(accounts[0]);
      getToken();
    }
  }, [accounts]);


  const login = async () => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0 && inProgress === InteractionStatus.None) {
      try {
        await msalInstance.loginRedirect(loginRequest);
      } catch (error) {
        console.error("Login failed:", error);
      }
    }
  };

  const logout = async () => {
    if (activeAccount) {
      try {
        await instance.logoutRedirect({
          account: activeAccount,
          //onRedirectNavigate: () => false, 
        });
        localStorage.removeItem('token');
      } catch (error) {
        console.error("Logout failed:", error);
      }
    } else {
      console.warn("No active account found for logout.");
    }
  }

  const getToken = async () => {
    const activeAccount = instance.getActiveAccount();
    if (!activeAccount) {
      console.error("No active account set. Please log in.");
      return;
    }

    try {
      const accessTokenRequest = {
        scopes: [...tokenRequest.scopes],
        account: activeAccount,
      };

      const response = await instance.acquireTokenSilent(accessTokenRequest);
      const token = response.accessToken;
      localStorage.setItem('token', token);
      setToken(token);
      //return token;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  return {
    isAuthenticated,
    login,
    logout,
    user,
    accounts,
    inProgress,
    token,
    getToken
  };
};

export default useAuth;




