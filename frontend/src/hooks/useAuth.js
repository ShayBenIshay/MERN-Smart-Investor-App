import { useMutation } from "@tanstack/react-query";
import { useAuth as useAuthContext } from "../context/AuthContext";
import { authAPI } from "../services/api";

/**
 * Enhanced auth hook with additional utilities
 */
export const useAuth = () => {
  const authContext = useAuthContext();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authAPI.login({ email, password }),
    onSuccess: (response) => {
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      // The context will handle setting the user
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: ({ email, password, cash = 0 }) =>
      authAPI.register({ email, password, cash }),
    onSuccess: (response) => {
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      // The context will handle setting the user
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData) => authAPI.updateProfile(profileData),
    onSuccess: () => {
      // Refresh user data after profile update
      authContext.refreshUser();
    },
    onError: (error) => {
      console.error("Profile update failed:", error);
    },
  });

  return {
    // Context data
    ...authContext,

    // Mutations
    loginMutation,
    registerMutation,
    updateProfileMutation,

    // Convenience methods
    loginAsync: loginMutation.mutateAsync,
    registerAsync: registerMutation.mutateAsync,
    updateProfileAsync: updateProfileMutation.mutateAsync,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,

    // Error states
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    updateProfileError: updateProfileMutation.error,
  };
};
