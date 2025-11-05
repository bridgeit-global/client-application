import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface FormFieldProps {
    label: string;
    id: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    id,
    type = "text",
    value,
    onChange,
    placeholder = "",
    required = false
}) => (
    <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={id} className="text-right text-sm font-medium">
            {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Input
            id={id}
            type={type}
            max={new Date().toISOString().slice(0, 10)}
            className="col-span-3"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
        />
    </div>
);              