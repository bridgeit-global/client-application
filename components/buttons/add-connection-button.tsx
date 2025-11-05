import IconButton from "./icon-button";
import { Plus } from "lucide-react";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import { ConnectionTableProps } from "@/types/connections-type";
import { PAY_TYPE } from "@/constants/bill";

export const AddConnectionButton = ({ siteId, connections }: { siteId?: string, connections?: ConnectionTableProps[] }) => {
    const router = useRouter();
    const handleOpen = () => {
        router.push(`/portal/connection-edit?paytype=&site_id=${siteId}`)
    }

    const goToConnections = (paytype: number) => {
        router.push(`/portal/site/${PAY_TYPE[paytype]}?site_id=${siteId}`);
    }
    const prepaidConnections = connections?.filter((connection) => connection.paytype === 0);
    const postpaidConnections = connections?.filter((connection) => connection.paytype === 1);
    const submeterConnections = connections?.filter((connection) => connection.paytype === -1);

    return (
        <>
            {siteId ? (
                (connections && connections?.length > 0) ?
                    <div className="flex  items-center gap-2">
                        {prepaidConnections && prepaidConnections?.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" onClick={() => goToConnections(0)} className="flex items-center gap-2 cursor-pointer hover:bg-primary/40">
                                    {prepaidConnections?.length} Prepaid
                                </Badge>
                                <IconButton size={'sm'} variant={'ghost'} icon={Plus} onClick={handleOpen} />
                            </div>

                        )}
                        {postpaidConnections && postpaidConnections?.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" onClick={() => goToConnections(1)} className="flex items-center gap-2 cursor-pointer hover:bg-primary/40">
                                    {postpaidConnections?.length}  Postpaid
                                </Badge>
                                <IconButton size={'sm'} variant={'ghost'} icon={Plus} onClick={handleOpen} />
                            </div>
                        )}
                        {submeterConnections && submeterConnections?.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" onClick={() => goToConnections(-1)} className="flex items-center gap-2 cursor-pointer hover:bg-primary/40">
                                    {submeterConnections?.length} Submeter
                                </Badge>
                                <IconButton size={'sm'} variant={'ghost'} onClick={handleOpen} icon={Plus} />
                            </div>
                        )}
                    </div> :
                    <IconButton variant={'outline'} onClick={handleOpen} icon={Plus} size={'sm'} />
            ) : (
                <IconButton onClick={handleOpen} icon={Plus} text="Add" />
            )}
            {/* <ConnectionFormModal payType={paytype.toString()} handleClose={handleClose} isOpen={open} siteId={siteId} /> */}
        </>
    );
};  