"use client"

import * as React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, Edit3 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { camelCaseToTitleCase } from "@/lib/utils/string-format"

interface RoleSelectProps {
    currentRole: string
    currentUserId: string
    userId: string
    phone: string
    isVerified: boolean
    onRoleUpdate?: (newRole: string) => void
}

const AVAILABLE_ROLES = [
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
    { value: "operator", label: "Operator" }
]

export function RoleSelect({ currentRole, currentUserId, userId, phone, isVerified, onRoleUpdate }: RoleSelectProps) {

    const [isEditing, setIsEditing] = React.useState(false)
    const [selectedRole, setSelectedRole] = React.useState(currentRole)
    const [isLoading, setIsLoading] = React.useState(false)

    const handleSave = async () => {
        if (selectedRole === currentRole) {
            setIsEditing(false)
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/user/update-role', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    newRole: selectedRole,
                    phone
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update role')
            }

            toast({
                title: "Success",
                description: `User role updated to ${camelCaseToTitleCase(selectedRole)}`,
            })

            onRoleUpdate?.(selectedRole)
            setIsEditing(false)
            window.location.reload()
        } catch (error) {
            console.error('Error updating role:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update user role",
                variant: "destructive",
            })
            setSelectedRole(currentRole) // Reset on error
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setSelectedRole(currentRole)
        setIsEditing(false)
    }

    // Don't show edit option for unverified users or if current user is admin
    if (!isVerified || currentUserId === userId) {
        return (
            <Badge variant="outline" className="font-medium">
                {camelCaseToTitleCase(currentRole || "user")}
            </Badge>
        )
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isLoading}>
                    <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {AVAILABLE_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                                {role.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                >
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-medium">
                {camelCaseToTitleCase(currentRole || "user")}
            </Badge>
            <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
            >
                <Edit3 className="h-3 w-3" />
            </Button>
        </div>
    )
}
