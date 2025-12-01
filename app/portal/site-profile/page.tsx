import { notFound } from "next/navigation"
import { MapPin, Calendar, ToggleLeft, Clock, Zap, Phone, Home, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getConnections, getSiteProfile } from "@/services/sites"
import { ddmmyy } from "@/lib/utils/date-format"
import { getPrepaidBalance } from "@/lib/utils"
import { formatRupees } from '@/lib/utils/number-format';
import { SearchParamsProps } from "@/types"
import 'mapbox-gl/dist/mapbox-gl.css'
import StatusBadge from "@/components/badges/status-badge"
import IsActiveBadge from "@/components/badges/is-active-badge"
import { getLatestBill, getLatestRecharge } from "@/lib/utils/bill"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { fetchOrganization } from "@/services/organization"
import { SiteAccountBoardCell } from "@/components/table-cells/site-account-board-cell"
import { useSiteName } from "@/lib/utils/site"
import { SiteProfileMap } from "@/components/maps/site-profile-map"

export default async function Page({
    searchParams
}: {
    searchParams: SearchParamsProps;
}) {
    const { site_name } = await fetchOrganization();
    if (!searchParams.id) {
        notFound()
    }
    const site = await getSiteProfile(searchParams.id)
    if (!site) {
        notFound()
    }

    const connections = await getConnections(searchParams.id)
    if (!connections) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900">No Connections Found</h2>
                    <p className="mt-2 text-gray-600">This {site_name} has no active connections.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900">{site.name}</h1>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-grow">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>{site_name} Details</CardTitle>
                                        <IsActiveBadge isActive={site.is_active} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">{site_name} ID</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{site.id}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">{site_name} Name</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{site.name}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Zone ID</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{site.zone_id || "N/A"}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Type</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{site.type || "N/A"}</dd>
                                        </div>
                                    </dl>
                                </CardContent>
                            </Card>
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Connection Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <Zap className="h-5 w-5 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-600">Total Connections: {connections.length}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Phone className="h-5 w-5 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-600">
                                                Active Connections: {connections.filter((c) => c.is_active).length}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <Wallet className="h-5 w-5 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-600">
                                                Total Security Deposit: {formatRupees(connections.reduce((sum, c) => sum + (c.security_deposit || 0), 0))}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Connections</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(() => {
                                        const postpaidConnections = connections.filter(connection => connection.paytype === 1);
                                        const prepaidConnections = connections.filter(connection => connection.paytype === 0);
                                        const submeterConnections = connections.filter(connection => connection.paytype === -1);
                                        const hasPostpaid = postpaidConnections.length > 0;
                                        const hasPrepaid = prepaidConnections.length > 0;
                                        const hasSubmeter = submeterConnections.length > 0;

                                        // If no connections of any type, show a message
                                        if (!hasPostpaid && !hasPrepaid && !hasSubmeter) {
                                            return (
                                                <div className="text-center text-gray-500">No connections found</div>
                                            );
                                        }

                                        // Default to the first available tab
                                        const defaultTab = hasPostpaid ? "postpaid" : hasPrepaid ? "prepaid" : "submeter";

                                        return (
                                            <Tabs defaultValue={defaultTab} className="space-y-4">
                                                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${[hasPostpaid, hasPrepaid, hasSubmeter].filter(Boolean).length}, 1fr)` }}>
                                                    {hasPostpaid && <TabsTrigger value="postpaid">Postpaid</TabsTrigger>}
                                                    {hasPrepaid && <TabsTrigger value="prepaid">Prepaid</TabsTrigger>}
                                                    {hasSubmeter && <TabsTrigger value="submeter">Sub Meter</TabsTrigger>}
                                                </TabsList>

                                                {hasPostpaid && (
                                                    <TabsContent value="postpaid">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Account Number</TableHead>
                                                                    <TableHead>Status</TableHead>
                                                                    <TableHead>Bill Status</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {postpaidConnections.map((connection) => {
                                                                    const latestBill = getLatestBill(connection.bills);
                                                                    return (
                                                                        <TableRow key={connection.id}>
                                                                            <TableCell>
                                                                                <SiteAccountBoardCell row={{ original: { connections: connection } }} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <IsActiveBadge isActive={connection.is_active} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {latestBill?.bill_status &&
                                                                                    <StatusBadge status={latestBill.bill_status} />
                                                                                }
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </TabsContent>
                                                )}

                                                {hasPrepaid && (
                                                    <TabsContent value="prepaid">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    {/* <TableHead>{useSiteName()}</TableHead> */}
                                                                    <TableHead>Status</TableHead>
                                                                    <TableHead>Recharge Status</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {prepaidConnections.map((connection) => {
                                                                    const latestRecharge = getLatestRecharge(connection.prepaid_recharge);
                                                                    const latestPrepaidBalance = getPrepaidBalance(connection.prepaid_balances);
                                                                    const prepaid_info = connection.prepaid_info;
                                                                    const isLowBalance = prepaid_info && latestPrepaidBalance?.balance_amount < prepaid_info.threshold_amount;

                                                                    return (
                                                                        <TableRow key={connection.id}>
                                                                            <TableCell>
                                                                                <SiteAccountBoardCell row={{ original: { connections: connection } }} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <IsActiveBadge isActive={connection.is_active} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {latestRecharge?.recharge_status ?
                                                                                    <StatusBadge status={latestRecharge.recharge_status} /> :
                                                                                    isLowBalance ? <Badge variant="destructive">Low Balance</Badge> : null
                                                                                }
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </TabsContent>
                                                )}

                                                {hasSubmeter && (
                                                    <TabsContent value="submeter">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Account Number</TableHead>
                                                                    <TableHead>Status</TableHead>
                                                                    <TableHead>Type</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {submeterConnections.map((connection) => {
                                                                    return (
                                                                        <TableRow key={connection.id}>
                                                                            <TableCell>
                                                                                <SiteAccountBoardCell row={{ original: { connections: connection } }} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <IsActiveBadge isActive={connection.is_active} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Badge variant="secondary">Sub Meter</Badge>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </TabsContent>
                                                )}
                                            </Tabs>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:w-1/3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{site_name} Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-600">
                                                Lat: {site.latitude}, Long: {site.longitude}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-600">
                                                Created: {ddmmyy(site.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="h-5 w-5 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-600">
                                                Updated: {ddmmyy(site.updated_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <ToggleLeft className="h-5 w-5 text-gray-400 mr-2" />
                                            <IsActiveBadge isActive={site.is_active} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Location</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full">
                                        <SiteProfileMap
                                            latitude={site?.latitude ?? 0}
                                            longitude={site?.longitude ?? 0}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
