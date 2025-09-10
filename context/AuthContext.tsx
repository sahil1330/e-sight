import User from "@/schema/userSchema";
import axiosInstance from "@/utils/axiosInstance";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { isAxiosError } from "axios";
import { SplashScreen } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

SplashScreen.preventAutoHideAsync();

interface AuthProps {
  authState?: {
    token: string | undefined;
    authenticated: boolean | undefined;
    userDetails: User | undefined;
  };
  register?: (
    fullName: string,
    email: string,
    password: string,
    phone: string,
    role: string
  ) => Promise<any>;
  verifyEmail?: (email: string, code: string) => Promise<any>;
  login?: (identifier: string, password: string) => Promise<any>;
  logout?: () => Promise<any>;
  updateConnectedUsers?: (connectedUsers: User) => Promise<any>;
  refreshUserState?: () => Promise<any>;
  isLoading?: boolean;
  setAuthState?: any;
  isReady?: boolean;
}

const TOKEN_KEY = "authState";

const AuthContext = createContext<AuthProps>({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: any) => {
  const [authState, setAuthState] = useState<{
    token: string | undefined;
    authenticated: boolean | undefined;
    userDetails: User | undefined;
  }>();
  const [isReady, setIsReady] = useState<boolean>(false);

  const storeAuthStateInStorage = async (newState: {
    authenticated: boolean | undefined;
    userDetails: User | undefined;
    token: string | undefined;
  }) => {
    try {
      const jsonValue = JSON.stringify(newState);
      await SecureStore.setItemAsync(TOKEN_KEY, jsonValue);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setIsReady(false);
    const getAuthFromStorage = async () => {
      try {
        const value = await SecureStore.getItemAsync("authState");
        if (value) {
          const auth = JSON.parse(value);
          setAuthState({
            token: auth.token,
            authenticated: true,
            userDetails: auth.userDetails,
          });
        }
      } catch (error) {
        // console.error("Error while getting auth from secure store", error);
      } finally {
        setIsReady(true);
      }
    };
    getAuthFromStorage();
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  useEffect(() => {
    if (authState?.token) {
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${authState.token}`;
    } else {
      axiosInstance.defaults.headers.common["Authorization"] = "";
    }
    if (authState?.userDetails) {
      storeAuthStateInStorage(authState);
    }
  }, [authState]);

  const register = async (
    fullName: string,
    email: string,
    password: string,
    phone: string,
    role: string
  ) => {
    try {
      const response = await axiosInstance.post("/users/register", {
        fullName,
        email,
        password,
        phone,
        role,
      });
      if (!response) {
        return { isError: true, message: "No response from server" };
      }
      if (response.data.statusCode !== 201) {
        return {
          isError: true,
          message: response.data.message || "Registration failed",
        };
      }

      return response.data.success;
    } catch (error) {
      return { isError: true, message: (error as any)?.message };
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      const result = await axiosInstance.post("/users/login", {
        identifier,
        password,
      });
      if (!result) {
        return { isError: true, message: "No response from server" };
      }
      const newState = {
        token: result.data.data.accessToken,
        authenticated: true,
        userDetails: result.data.data.user,
      };
      setAuthState(newState);
      await storeAuthStateInStorage(newState);
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${newState.token}`;
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      if (isAxiosError(error)) {
        console.error("Axios error:", error);
        const errorMessage = await getErrorMessage((error as any).response?.data);
        return { isError: true, message: errorMessage };
      }
      return {
        isError: true,
        message: (error as any)?.message || "Login failed",
      };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      const result = await axiosInstance.post("/users/logout");
      axiosInstance.defaults.headers.common["Authorization"] = "";
      // Reset Auth State
      setAuthState({
        token: undefined,
        authenticated: false,
        userDetails: undefined,
      });
      return result.data.statusCode;
    } catch (error) {
      return { isError: true, message: error };
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const result = await axiosInstance.post("/users/verify", {
        email,
        code,
      });

      if (!result) {
        return { isError: true, message: "No response from server" };
      }

      if (result.data.statusCode !== 200) {
        return {
          isError: true,
          message: result.data.message || "Verification failed",
        };
      }

      const newState = {
        token: result.data.data.accessToken,
        authenticated: true,
        userDetails: result.data.data.user,
      };

      setAuthState(newState);
      await storeAuthStateInStorage(newState);
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${newState.token}`;
      return newState;
    } catch (error) {
      return { isError: true, message: error };
    }
  };

  const updateConnectedUsers = async (connectedUser: User) => {
    try {
      setAuthState(prev => {
        if (!prev || !prev.userDetails) {
          throw new Error("User details not found in auth state");
        }
        prev.userDetails.connectedUsers?.push(connectedUser);

        return {
          ...prev,
          userDetails: {
            ...prev.userDetails,
            connectedUsers: prev.userDetails.connectedUsers,
          },
        };
      });
      return { success: true, message: "Connected users updated successfully" };
    } catch (error) {
      console.error("Error updating connected users:", error);
      if (error instanceof Error) {
        return { isError: true, message: error.message };
      }
    }
  }

  const refreshUserState = async () => {
    try {
      const response = await axiosInstance.get("/users/current-user");
      if (!response || response.status !== 200) {
        throw new Error("Failed to refresh user state");
      }
      const newState = {
        token: authState?.token,
        authenticated: true,
        userDetails: response.data.data,
      };
      setAuthState(newState);
      // await storeAuthStateInStorage(newState);
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${newState.token}`;
      return { success: true, message: "User state refreshed successfully" };
    } catch (error) {
      console.error("Error refreshing user state:", error);
      if (error instanceof Error) {
        return { isError: true, message: error.message };
      }
      if (isAxiosError(error)) {
        const errorMessage = await getErrorMessage(error.response?.data || "");
        return { isError: true, message: errorMessage };
      }
      return { isError: true, message: "Failed to refresh user state" };
    }
  }

  return (
    <AuthContext.Provider
      value={{ register, login, logout, verifyEmail, isReady, authState, updateConnectedUsers, refreshUserState }}
    >
      {children}
    </AuthContext.Provider>
  );
};
