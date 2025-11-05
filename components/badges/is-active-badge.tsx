'use client';
import React from 'react';
import { Badge } from '../ui/badge';
const IsActiveBadge = ({ isActive }: { isActive: boolean }) => {
    return (
        <Badge variant={isActive ? 'success' : 'destructive'}>
            {isActive ? 'Active' : 'Inactive'}
        </Badge>
    );
}
export default IsActiveBadge;
