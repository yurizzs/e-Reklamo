import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useCallback } from "react";
import type { AxiosResponse } from "axios";
import type { User } from "../interfaces/user";
import AuthService from "../services/AuthService";

const CURRENT_USER_QUERY_KEY = ["auth", "me"] as const;

interface CurrentUserResponse {
    data?: { user?: User | null };
}

interface LoginResponse {
    data: {
        user?: User | null;
        token?: string;
    };
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: { username: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const {
        data: user,
        isLoading,
        refetch: refetchCurrentUser,
    } = useQuery({
        queryKey: CURRENT_USER_QUERY_KEY,
        queryFn: async () => {
            const response = await AuthService.me();
            return (response as CurrentUserResponse)?.data?.user ?? null;
        },
    });

    const refreshUser = useCallback(async () => {
        await refetchCurrentUser();
    }, [refetchCurrentUser]);

    const clearOtherCachedData = () => {
        const currentUserQuery = queryClient.getQueryCache().find({
            queryKey: CURRENT_USER_QUERY_KEY,
            exact: true,
        });

        queryClient.removeQueries({
            predicate: (query) => query !== currentUserQuery,
        });
    };

    /**
     * Login flow: CSRF -> authenticate -> refresh user state.
     */
    const login = async (credentials: { username: string; password: string }) => {
        await AuthService.csrf();
        const response = await AuthService.login(credentials) as AxiosResponse<LoginResponse>;
        const dataPayload = response.data.data;
        if (dataPayload?.token) {
            localStorage.setItem("auth_token", dataPayload.token);
        }
        await queryClient.cancelQueries();
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, dataPayload.user ?? null);
        clearOtherCachedData();
    };

    /**
     * Logout flow: call server -> clear local state.
     */
    const logout = async () => {
        try {
            await AuthService.logout();
        } finally {
            localStorage.removeItem("auth_token");
            await queryClient.cancelQueries();
            queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
            clearOtherCachedData();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an <AuthProvider>");
    }
    return context;
};