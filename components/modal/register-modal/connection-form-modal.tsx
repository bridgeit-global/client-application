'use client';
import { Modal } from '../../ui/modal';
import ConnectionForm from '../../forms/client-form/connection-form';
import { useSiteName } from '@/lib/utils/site';

export const ConnectionFormModal = ({ payType, isOpen, handleClose, siteId }: { payType?: string, isOpen: boolean, handleClose: () => void, siteId: string | undefined }) => {
    const site_name = useSiteName();
    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Add Connection"
                description={`Add a new connection to the ${site_name}`}
            >
                <div className="max-h-[calc(80vh-100px)] overflow-y-auto">
                    <ConnectionForm paytype={payType} site_id={siteId} />
                </div>
            </Modal>
        </>
    );
};      
