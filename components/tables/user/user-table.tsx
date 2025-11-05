"use client"

import * as React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, UserPlus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ddmmyy } from "@/lib/utils/date-format"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { UserFormModal } from "@/components/modal/register-modal/user-form-modal"
import { camelCaseToTitleCase } from '@/lib/utils/string-format'
import IconButtonHover from "@/components/buttons/icon-button-hover"
import { User } from "lucide-react"
import { createClient, createPublicClient } from "@/lib/supabase/client"
import { RoleSelect } from "@/components/ui/role-select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useUserStore } from "@/lib/store/user-store"

interface User {
    id: string
    first_name: string
    last_name: string
    email: string
    phone_no: string
    role: string | null
    phone_confirmed_at: string | null
    email_confirmed_at: string | null
    created_at: string
    updated_at: string
}

type UserProps = {
    phone: string
    verified: boolean
    first_name: string
    last_name: string
    email: string
    user: User
    request_type?: 'user-request' | string
    created_at?: string
    role: string,
}

interface UserTableProps {
    users: UserProps[]
}

export function UserTable({ users }: UserTableProps) {




    const supabase = createClient();
    const supabasePublic = createPublicClient();
    const { user: currentUser } = useUserStore();
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isAccepting, setIsAccepting] = React.useState<string | null>(null);
    const [userToDelete, setUserToDelete] = React.useState<UserProps | null>(null);

    const router = useRouter();

    const filteredUsers = React.useMemo(() => {
        if (!searchQuery) return users;

        const query = searchQuery.toLowerCase();
        return users.filter(user => {
            const phoneMatch = user.phone.toLowerCase().includes(query);
            const nameMatch = user.user?.first_name?.toLowerCase().includes(query) ||
                user.user?.last_name?.toLowerCase().includes(query);
            const emailMatch = user.user?.email?.toLowerCase().includes(query);
            const roleMatch = user.user?.role?.toLowerCase().includes(query);

            return phoneMatch || nameMatch || emailMatch || roleMatch;
        });
    }, [users, searchQuery]);

    const handleDelete = async (user: UserProps) => {
        try {
            setIsDeleting(user?.phone)
            const { error } = await supabasePublic.from('user_requests').delete().eq('phone', user?.phone).single();
            if (error) throw error;
            if (user?.request_type === 'user-request') {
                await supabase.functions.invoke('user-status-notification', {
                    method: "POST",
                    body: JSON.stringify({
                        "name": user?.first_name + " " + user?.last_name,
                        "email": user?.email,
                        "status": "rejected",
                        "url": `https://${window.location.host}`
                    })
                })
            }
            toast({
                title: "Success",
                description: "User deleted successfully",
            })
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete user",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(null)
        }
    }

    const handleAccept = async (user: UserProps) => {
        try {
            setIsAccepting(user?.phone)
            const { error } = await supabasePublic.from('user_requests').update({
                request_type: 'invitation'
            }).eq('phone', user?.phone).single();
            if (error) throw error;
            if (user?.request_type === 'user-request') {
                await supabase.functions.invoke('user-status-notification', {
                    method: "POST",
                    body: JSON.stringify({
                        "name": user?.first_name + " " + user?.last_name,
                        "email": user?.email,
                        "status": "accepted",
                        "url": `https://${window.location.host}`
                    })
                })
            }
            toast({
                title: "Success",
                description: "User request accepted successfully",
            })
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to accept user request",
                variant: "destructive",
            })
        } finally {
            setIsAccepting(null)
        }
    }

    return (
        <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Users</h2>
                <p className="text-muted-foreground text-sm">
                    Manage and view all users in the system. You can add new users, search existing ones, and perform actions.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by phone, name, email or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full transition-all duration-200 border-gray-200 focus:border-gray-400"
                    />
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full sm:w-auto"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="py-4 font-semibold text-gray-900 w-[100px]">Phone</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-900 w-[100px]"></TableHead>
                                <TableHead className="py-4 font-semibold text-gray-900 w-[150px]">Role</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-900 w-[150px]">Status</TableHead>
                                <TableHead className="py-4 font-semibold text-gray-900 w-[200px]">Created At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Search className="h-8 w-8 mb-2 text-gray-300" />
                                            <p>No users found</p>
                                            <p className="text-sm">Try adjusting your search</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow

                                        key={user.phone}
                                        className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <TableCell className="font-medium">
                                            {(user.user?.first_name || user.user?.email) ? (
                                                <div className="relative group">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-medium hover:text-primary cursor-pointer">
                                                            {user.phone}
                                                        </span>
                                                        <svg
                                                            className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>

                                                    <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                                        <div className="py-1">
                                                            <div className="px-4 py-2 text-sm text-gray-700 border-b">
                                                                {user.user?.first_name && (
                                                                    <div className="font-medium">{user.user?.first_name} {user.user?.last_name}</div>
                                                                )}
                                                                {user.user?.email && (
                                                                    <div className="text-gray-500">{user.user?.email}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-medium">
                                                    {user.phone}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user?.role === 'admin' ? null : <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setUserToDelete(user)}
                                                    disabled={isDeleting === user?.phone}
                                                    className={`
                                                        rounded-full p-2 hover:bg-red-50 hover:text-red-600 transition-colors duration-200
                                                        ${isDeleting === user?.phone ? 'opacity-50 cursor-not-allowed' : ''}
                                                    `}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>}

                                                {user?.request_type === 'user-request' && user?.role !== 'admin' && (
                                                    <IconButtonHover
                                                        icon={UserPlus}
                                                        text="Accept"
                                                        onClick={() => handleAccept(user)}
                                                        disabled={isDeleting === user?.phone || isAccepting === user?.phone}
                                                        className={`
                                                            rounded-full p-2 bg-green-50 text-green-600 hover:bg-green-100 
                                                            transition-colors duration-200 border border-green-200
                                                            ${(isDeleting === user?.phone || isAccepting === user?.phone)
                                                                ? 'opacity-50 cursor-not-allowed'
                                                                : ''
                                                            }
                                                        `}
                                                    />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <RoleSelect
                                                currentUserId={currentUser?.id || ""}
                                                currentRole={user?.role || "user"}
                                                userId={user.user?.id || ""}
                                                phone={user.phone}
                                                isVerified={user.verified}
                                                onRoleUpdate={() => router.refresh()}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={'outline'}
                                                className={`
                                                    px-3 py-1 rounded-full font-medium
                                                    ${user?.request_type === 'user-request'
                                                        ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                                                        : user.verified
                                                            ? "bg-green-50 text-green-700 border-green-300"
                                                            : "bg-gray-50 text-gray-700 border-gray-300"
                                                    }
                                                `}
                                            >
                                                {user?.request_type === 'user-request' ? "Request" : user.verified ? "Verified" : "Pending"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.verified
                                                ? user?.user?.created_at && ddmmyy(user?.user?.created_at)
                                                : user?.created_at && ddmmyy(user.created_at)
                                            }
                                        </TableCell>

                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {filteredUsers.length > 0 && (
                <div className="text-sm text-muted-foreground text-center bg-gray-50 py-2 px-4 rounded-md">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            )}
            <UserFormModal
                isOpen={isCreateModalOpen}
                handleClose={() => {
                    setIsCreateModalOpen(false)
                    router.refresh()
                }}
            />
            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (userToDelete) {
                                    handleDelete(userToDelete);
                                    setUserToDelete(null);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                        >
                            {isDeleting === userToDelete?.phone ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
