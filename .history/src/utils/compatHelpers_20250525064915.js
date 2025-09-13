/**
 * Helper functions to maintain backwards compatibility during API transition
 */

/**
 * Safely handle both the new object return format and legacy boolean format
 * from setUserRole and similar functions
 * 
 * @param {Object|boolean} result - Result from setUserRole (either {success, error} or boolean)
 * @returns {boolean} Success status
 */
export const getSuccessFromResult = (result) => {
  if (result === undefined || result === null) return false;
  return typeof result === 'object' ? !!result.success : !!result;
};

/**
 * Get the error message from a result object, with fallback
 * 
 * @param {Object|boolean} result - Result from setUserRole (either {success, error} or boolean)
 * @param {string} fallbackMsg - Fallback message if no error is present
 * @returns {string} Error message
 */
export const getErrorFromResult = (result, fallbackMsg = 'Unknown error occurred') => {
  if (!result || typeof result !== 'object' || !result.error) {
    return fallbackMsg;
  }
  return result.error;
};
