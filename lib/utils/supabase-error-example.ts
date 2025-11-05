import { createClient } from '../supabase/client';
import {
    handleDatabaseError,
    getDatabaseErrorMessage,
    getFormErrorMessage,
    logAndHandleDatabaseError,
    isConstraintViolation
} from './supabase-error';

// Example usage in API routes or server actions
export async function createUser(userData: any) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single();

        if (error) {
            // Handle the error with human-readable message
            const handledError = handleDatabaseError(error);
            throw new Error(handledError.message);
        }

        return data;
    } catch (error) {
        // Re-throw the error with user-friendly message
        throw error;
    }
}

// Example usage in forms
export async function handleFormSubmission(formData: any) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('bills')
            .insert(formData)
            .select()
            .single();

        if (error) {
            // Get field-specific error message
            const fieldError = getFormErrorMessage(error, 'amount');
            return { success: false, error: fieldError };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

// Example usage with logging
export async function updateUserProfile(userId: string, profileData: any) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .update(profileData)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            // Log error for debugging and return user-friendly message
            const handledError = logAndHandleDatabaseError(error, 'updateUserProfile');
            return { success: false, error: handledError.message };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

// Example usage with constraint checking
export async function deleteRecord(recordId: string) {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('records')
            .delete()
            .eq('id', recordId);

        if (error) {
            if (isConstraintViolation(error)) {
                return {
                    success: false,
                    error: 'Cannot delete this record as it is being used by other records.'
                };
            }

            const handledError = handleDatabaseError(error);
            return { success: false, error: handledError.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred' };
    }
}

// Example usage in React components
export function useDatabaseError() {
    const handleError = (error: any) => {
        if (error?.code) {
            // This is a Supabase error
            return getDatabaseErrorMessage(error);
        }

        // Handle other types of errors
        return error?.message || 'An unexpected error occurred';
    };

    return { handleError };
} 