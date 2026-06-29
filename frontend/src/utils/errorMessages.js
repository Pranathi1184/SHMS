export const toUserFriendlyError = (error, fallback = 'Something went wrong. Please try again.') => {
  const serverMessage = error?.response?.data?.message;

  if (!serverMessage) return fallback;

  const normalized = serverMessage.toLowerCase();

  if (normalized.includes('not found')) {
    return `${serverMessage}. Refresh the page and retry.`;
  }

  if (normalized.includes('already') || normalized.includes('duplicate')) {
    return `${serverMessage}. Please review existing records before submitting again.`;
  }

  if (normalized.includes('required') || normalized.includes('invalid')) {
    return `${serverMessage}. Check highlighted fields and submit again.`;
  }

  if (normalized.includes('forbidden') || normalized.includes('permission')) {
    return 'You do not have permission for this action. Contact an administrator if this seems incorrect.';
  }

  if (normalized.includes('internal server error')) {
    return 'Server is temporarily unavailable. Please retry in a moment.';
  }

  return serverMessage;
};
