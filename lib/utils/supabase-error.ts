import { PostgrestError } from '@supabase/supabase-js';

// Database error codes and human-readable messages
export const DATABASE_ERROR_MESSAGES: Record<string, string> = {
  // Constraint violations
  '23505': 'A record with this information already exists in our system. Please verify the details and try again.',
  '23503': 'This operation cannot be completed as it references data that does not exist in our records. Please verify all information and try again.',
  '23502': 'Required information is missing from your submission. Please ensure all mandatory fields are completed before proceeding.',
  '23514': 'The data provided does not meet our system requirements. Please review the format and constraints for each field.',

  // Data type and format errors
  '22P02': 'The data format provided is not valid. Please check the input format and ensure it matches our requirements.',
  '22P08': 'The data type provided is not supported. Please use the correct format for this field.',
  '22P12': 'The data value provided is outside the acceptable range. Please enter a value within the specified limits.',

  // Permission and access errors
  '42501': 'You do not have the necessary permissions to perform this action. Please contact your administrator for assistance.',
  '42502': 'Access to this resource is restricted. Please contact support for assistance.',

  // Connection and system errors
  '08000': 'We are currently unable to connect to our database. Please try again in a few moments or contact support if the issue persists.',
  '08003': 'The connection to our database has been lost. Please refresh the page and try again.',
  '08006': 'The database connection has been terminated. Please try again or contact support if the issue persists.',

  // Transaction and conflict errors
  '40001': 'This operation could not be completed due to a system conflict. Please wait a moment and try again.',
  '40002': 'A transaction conflict has occurred. Please try again with your request.',
  '40P01': 'The system is currently busy processing other requests. Please wait a moment and try again.',

  // Resource and object errors
  '42P01': 'The requested resource does not exist in our system. Please verify the information and try again.',
  '42P02': 'The requested object does not exist. Please check the information and try again.',
  '42703': 'The requested field does not exist in our system. Please contact support for assistance.',

  // Authentication and authorization errors
  '28P01': 'Authentication failed. Please verify your credentials and try again.',
  '28P02': 'Your session has expired. Please log in again to continue.',

  // Default error
  'default': 'We apologize, but an unexpected error has occurred. Please try again or contact our support team for assistance.'
};

/**
 * Converts a Supabase database error to a human-readable message
 */
export function getDatabaseErrorMessage(error: PostgrestError): string {
  const code = error.code || 'default';
  return DATABASE_ERROR_MESSAGES[code] || DATABASE_ERROR_MESSAGES.default;
}

/**
 * Handles Supabase errors and returns a structured error object
 */
export function handleDatabaseError(error: PostgrestError) {
  return {
    message: getDatabaseErrorMessage(error),
    code: error.code || 'default',
    originalError: error,
    isUserFriendly: true
  };
}

/**
 * Checks if an error is a constraint violation
 */
export function isConstraintViolation(error: PostgrestError): boolean {
  const code = error.code;
  return ['23505', '23503', '23502', '23514', '22P02', '22P08', '22P12'].includes(code || '');
}

/**
 * Gets a user-friendly error message for form validation
 */
export function getFormErrorMessage(error: PostgrestError, fieldName?: string): string {
  if (fieldName && error.message.toLowerCase().includes(fieldName.toLowerCase())) {
    return `The ${fieldName} field contains invalid information. Please review and correct the input.`;
  }
  return getDatabaseErrorMessage(error);
}

/**
 * Logs database errors for debugging while returning user-friendly messages
 */
export function logAndHandleDatabaseError(error: PostgrestError, context?: string) {
  console.error('Database Error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    context
  });

  return handleDatabaseError(error);
}

export interface DatabaseErrorResponse {
  message: string;
  code: string;
  originalError: PostgrestError;
  isUserFriendly: boolean;
}

/**
 * Gets a context-specific error message for common operations
 */
export function getContextualErrorMessage(error: PostgrestError, context: string): string {
  const baseMessage = getDatabaseErrorMessage(error);

  switch (context.toLowerCase()) {
    case 'login':
    case 'authentication':
      return 'Authentication failed. Please verify your credentials and try again.';
    case 'registration':
      return 'Registration could not be completed. Please verify all information and try again.';
    case 'payment':
      return 'Payment processing could not be completed. Please verify your payment details and try again.';
    case 'bill':
      return 'Bill information could not be processed. Please verify the details and try again.';
    case 'profile':
      return 'Profile update could not be completed. Please verify the information and try again.';
    case 'upload':
      return 'File upload could not be completed. Please verify the file format and try again.';
    case 'export':
      return 'Data export could not be completed. Please try again or contact support.';
    default:
      return baseMessage;
  }
}

/**
 * Gets a user-friendly error message with suggested actions
 */
export function getErrorWithSuggestions(error: PostgrestError): { message: string; suggestions: string[] } {
  const message = getDatabaseErrorMessage(error);
  const suggestions: string[] = [];

  const code = error.code;

  switch (code) {
    case '23505':
      suggestions.push('Check if you have already submitted this information');
      suggestions.push('Verify that all details are correct');
      break;
    case '23502':
      suggestions.push('Review the form and ensure all required fields are filled');
      suggestions.push('Check for any missing mandatory information');
      break;
    case '23514':
      suggestions.push('Review the data format requirements');
      suggestions.push('Ensure all values meet the specified constraints');
      break;
    case '42501':
      suggestions.push('Contact your system administrator for access permissions');
      suggestions.push('Verify your account has the necessary privileges');
      break;
    case '08000':
    case '08003':
    case '08006':
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
      suggestions.push('Contact support if the issue persists');
      break;
    default:
      suggestions.push('Try the operation again');
      suggestions.push('Contact support if the issue continues');
  }

  return { message, suggestions };
} 