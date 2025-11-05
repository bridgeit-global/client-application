'use client';

import { UserForm } from '../../forms/user-form';
import { Modal } from '../../ui/modal';

export const UserFormModal = ({ isOpen, handleClose }: { isOpen: boolean, handleClose: () => void }) => {
    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Create User"
                description="Add a new user to the system"
            >
                <UserForm handleClose={handleClose} />
            </Modal>
        </>
    );
}; 