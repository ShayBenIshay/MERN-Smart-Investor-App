// Utility function to get display name for user
export const getDisplayName = (user) => {
  if (user?.firstName && user.firstName.trim() !== "") {
    return user.firstName;
  }
  return user?.email || "User";
};
