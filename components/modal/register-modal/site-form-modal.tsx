'use client';
import { Modal } from '../../ui/modal';
import { CreateSiteOne } from '../../forms/client-form/create-site';
export const SiteFormModal = ({ isOpen, handleClose }: { isOpen: boolean, handleClose: () => void }) => {
    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title=""
                description=""
            >
                <CreateSiteOne initialData={null} handleClose={handleClose} />
            </Modal>
        </>
    );
};      
