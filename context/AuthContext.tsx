import User from "@/schema/userSchema";
import axiosInstance from "@/utils/axiosInstance";
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
    authenticated: boolean;
    userDetails: User;
    token: string;
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
      await new Promise((res) => setTimeout(() => res(null), 1000));
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
        console.log("Error while getting auth from secure store", error);
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

  const register = async (
    fullName: string,
    email: string,
    password: string,
    phone: string,
    role: string
  ) => {
    try {
      return await axiosInstance.post("/users/register", {
        fullName,
        email,
        password,
        phone,
        role,
      });
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
      console.log("file: AuthContext.tsx, line 112: login: result ", result);
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
      return { error: true, message: error };
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
      return result;
    } catch (error) {
      return { isError: true, message: error };
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      return await axiosInstance.post("/users/verify", {
        email,
        code,
      });
    } catch (error) {
      return { message: error };
    }
  };

  return (
    <AuthContext.Provider
      value={{ register, login, logout, verifyEmail, isReady, authState }}
    >
      {children}
    </AuthContext.Provider>
  );
};
