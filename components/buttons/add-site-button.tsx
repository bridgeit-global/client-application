import IconButton from "./icon-button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export const AddSiteButton = () => {
    const router = useRouter();
    
    const handleAdd = () => {
        router.push('/portal/site-edit');
    }

    return (
        <IconButton onClick={handleAdd} icon={Plus} text="Add" />
    );
};  