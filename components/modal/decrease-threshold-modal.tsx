import { useState } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogFooter
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LoadingSpinner } from '../ui/loading-spinner';

interface DecreaseThresholdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
    loading?: boolean;
}

export function DecreaseThresholdModal({ isOpen, onClose, onConfirm, loading = false }: DecreaseThresholdModalProps) {
    const [amount, setAmount] = useState(0);
    const [error, setError] = useState("");

    const handleConfirm = () => {
        if (!amount || amount <= 0) {
            setError("Please enter a valid amount");
            return;
        }
        setError("");
        onConfirm(amount);
        setAmount(0);
    };

    const handleClose = () => {
        setAmount(0);
        setError("");
        onClose();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open: boolean) => { if (!open) handleClose(); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Decrease Threshold</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="flex flex-col gap-2">
                    <label htmlFor="decrease-amount" className="text-sm">Amount to decrease</label>
                    <Input
                        id="decrease-amount"
                        type="number"
                        min={1}
                        value={amount || ""}
                        onChange={e => setAmount(Number(e.target.value))}
                        placeholder="Enter amount"
                        autoFocus
                    />
                    {error && <span className="text-red-500 text-xs">{error}</span>}
                </div>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
                        {loading ? <LoadingSpinner size={20} className="mr-2" /> : null}
                        Confirm
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 