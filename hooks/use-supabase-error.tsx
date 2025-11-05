'use client';

import { useState, useCallback } from 'react';
import { PostgrestError } from '@supabase/supabase-js';
import {
    handleDatabaseError,
    getDatabaseErrorMessage,
    getFormErrorMessage,
    logAndHandleDatabaseError,
    isConstraintViolation,
    getContextualErrorMessage,
    getErrorWithSuggestions,
    type DatabaseErrorResponse
} from '../lib/utils/supabase-error';

interface UseSupabaseErrorReturn {
    error: string | null;
    setError: (error: string | null) => void;
    clearError: () => void;
    handleDatabaseError: (error: PostgrestError) => string;
    handleFormError: (error: PostgrestError, fieldName?: string) => string;
    isConstraintError: (error: PostgrestError) => boolean;
    logAndHandleError: (error: PostgrestError, context?: string) => DatabaseErrorResponse;
    getContextualError: (error: PostgrestError, context: string) => string;
    getErrorWithSuggestions: (error: PostgrestError) => { message: string; suggestions: string[] };
}

export function useSupabaseError(): UseSupabaseErrorReturn {
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleDbError = useCallback((error: PostgrestError): string => {
        const handledError = handleDatabaseError(error);
        setError(handledError.message);
        return handledError.message;
    }, []);

    const handleFormError = useCallback((error: PostgrestError, fieldName?: string): string => {
        const message = getFormErrorMessage(error, fieldName);
        setError(message);
        return message;
    }, []);

    const isConstraintError = useCallback((error: PostgrestError): boolean => {
        return isConstraintViolation(error);
    }, []);

    const logAndHandleError = useCallback((error: PostgrestError, context?: string): DatabaseErrorResponse => {
        const handledError = logAndHandleDatabaseError(error, context);
        setError(handledError.message);
        return handledError;
    }, []);

    const getContextualError = useCallback((error: PostgrestError, context: string): string => {
        return getContextualErrorMessage(error, context);
    }, []);

    const getErrorWithSuggestions = useCallback((error: PostgrestError): { message: string; suggestions: string[] } => {
        return getErrorWithSuggestions(error);
    }, []);

    return {
        error,
        setError,
        clearError,
        handleDatabaseError: handleDbError,
        handleFormError,
        isConstraintError,
        logAndHandleError,
        getContextualError,
        getErrorWithSuggestions
    };
}

// Hook for handling async operations with error handling
export function useAsyncOperation<T>() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<T | null>(null);

    const execute = useCallback(async (operation: () => Promise<T>) => {
        setLoading(true);
        setError(null);

        try {
            const result = await operation();
            setData(result);
            return { success: true, data: result };
        } catch (err: any) {
            let errorMessage = 'An unexpected error occurred';

            if (err?.code) {
                // This is a Supabase error
                errorMessage = getDatabaseErrorMessage(err);
            } else if (err?.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        loading,
        error,
        data,
        execute,
        clearError
    };
} 