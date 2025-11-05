import React from 'react'
import { Button } from './ui/button';
import { DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';
import { DropdownMenu } from './ui/dropdown-menu';
import { Columns } from 'lucide-react';
import { Table as TableInstance } from '@tanstack/react-table';

// Helper function to extract header text from column definition
const getHeaderText = (column: any, table: any): string => {
    const header = column.columnDef.header;

    // If header is a string, return it directly
    if (typeof header === 'string') {
        return header;
    }

    // If header is a function, try to extract text from the returned JSX
    if (typeof header === 'function') {
        try {
            // Pass both column and table to the header function
            const headerDef = header({ column, table });

            // If it's a React element with children, try to extract text
            if (React.isValidElement(headerDef) && headerDef.props && typeof headerDef.props === 'object') {
                const children = (headerDef.props as any).children;

                // If children is a string, return it directly
                if (typeof children === 'string') {
                    return children;
                }

                // If children is an array, find the first string child
                if (Array.isArray(children)) {
                    // Look for the first string child (this handles cases like "Bill Date" + icon)
                    const textChild = children.find(child => typeof child === 'string');
                    if (textChild) {
                        return textChild.trim();
                    }
                }

                // If children is a React element, try to extract text from its children
                if (React.isValidElement(children) && children.props && typeof children.props === 'object') {
                    const nestedChildren = (children.props as any).children;
                    if (typeof nestedChildren === 'string') {
                        return nestedChildren;
                    }
                    if (Array.isArray(nestedChildren)) {
                        const textChild = nestedChildren.find(child => typeof child === 'string');
                        if (textChild) {
                            return textChild.trim();
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Could not extract header text:', error);
        }
    }

    // Fallback to column ID or a default
    return column.id || 'Unknown';
};

const TableColumns = ({ table }: { table: TableInstance<any> }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="ml-auto">
                    <Columns className="h-4 w-4 sm:mr-2" />
                    <div className="hidden md:block">Columns</div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                        return (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) =>
                                    column.toggleVisibility(!!value)
                                }
                                onSelect={(event) => {
                                    event.preventDefault();
                                }}
                            >
                                {getHeaderText(column, table)}
                            </DropdownMenuCheckboxItem>
                        );
                    })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default TableColumns