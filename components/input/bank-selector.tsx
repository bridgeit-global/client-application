import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BankSelectorProps {
    label?: string;
    placeholder?: string;
    onChange: (value: string) => void;
    defaultValue?: string;
}

const BANK_DATA = {
    "public_sector_banks": [
        "State Bank of India",
        "Bank of Baroda",
        "Punjab National Bank",
        "Bank of India",
        "Canara Bank",
        "Union Bank of India",
        "Indian Bank",
        "Central Bank of India",
        "Indian Overseas Bank",
        "UCO Bank",
        "Bank of Maharashtra",
        "Punjab and Sind Bank"
    ],
    "private_sector_banks": [
        "HDFC Bank",
        "ICICI Bank",
        "Axis Bank",
        "Kotak Mahindra Bank",
        "IndusInd Bank",
        "Yes Bank",
        "IDBI Bank",
        "IDFC First Bank",
        "Federal Bank",
        "South Indian Bank",
        "Karnataka Bank",
        "Karur Vysya Bank",
        "City Union Bank",
        "Jammu & Kashmir Bank",
        "DCB Bank",
        "RBL Bank",
        "Bandhan Bank",
        "CSB Bank",
        "Dhanlaxmi Bank",
        "Tamilnad Mercantile Bank",
        "Nainital Bank"
    ],
    "small_finance_banks": [
        "AU Small Finance Bank",
        "Equitas Small Finance Bank",
        "Ujjivan Small Finance Bank",
        "Suryoday Small Finance Bank",
        "Utkarsh Small Finance Bank",
        "ESAF Small Finance Bank",
        "Jana Small Finance Bank",
        "North East Small Finance Bank",
        "Fincare Small Finance Bank",
        "Capital Small Finance Bank",
        "Shivalik Small Finance Bank",
        "Unity Small Finance Bank"
    ],
    "payment_banks": [
        "Airtel Payments Bank",
        "India Post Payments Bank",
        "Fino Payments Bank",
        "Paytm Payments Bank",
        "Jio Payments Bank",
        "NSDL Payments Bank"
    ],
    "regional_rural_banks": [
        "Andhra Pradesh Grameena Vikas Bank",
        "Andhra Pragathi Grameena Bank",
        "Arunachal Pradesh Rural Bank",
        "Assam Gramin Vikash Bank",
        "Bihar Gramin Bank",
        "Chhattisgarh Rajya Gramin Bank",
        "Gujarat Gramin Bank",
        "Sarva Haryana Gramin Bank",
        "Himachal Pradesh Gramin Bank",
        "Jammu and Kashmir Grameen Bank",
        "Jharkhand Rajya Gramin Bank",
        "Karnataka Grameena Bank",
        "Kerala Gramin Bank",
        "Madhya Pradesh Gramin Bank",
        "Maharashtra Gramin Bank",
        "Manipur Rural Bank",
        "Meghalaya Rural Bank",
        "Mizoram Rural Bank",
        "Nagaland Rural Bank",
        "Odisha Grameen Bank",
        "Puduvai Bharathiyar Grama Bank",
        "Punjab Gramin Bank",
        "Rajasthan Marudhara Gramin Bank",
        "Baroda Rajasthan Kshetriya Gramin Bank",
        "Saptagiri Grameena Bank",
        "Tamil Nadu Grama Bank",
        "Telangana Grameena Bank",
        "Tripura Gramin Bank",
        "Uttarakhand Gramin Bank",
        "Uttar Pradesh Gramin Bank",
        "Baroda Uttar Pradesh Gramin Bank",
        "Bangiya Gramin Vikash Bank",
        "Paschim Banga Gramin Bank",
        "Uttarbanga Kshetriya Gramin Bank",
        "Chaitanya Godavari Grameena Bank",
        "Ellaquai Dehati Bank",
        "Aryavart Bank",
        "Utkal Gramin Bank",
        "Madhyanchal Gramin Bank",
        "Dakshin Bihar Gramin Bank",
        "Uttar Bihar Gramin Bank",
        "Vidharbha Konkan Gramin Bank",
        "Karnataka Vikas Grameena Bank",
        "Prathama UP Gramin Bank"
    ],
    "foreign_banks": [
        "Citibank N.A.",
        "HSBC Bank",
        "Standard Chartered Bank",
        "Deutsche Bank",
        "Bank of America",
        "DBS Bank",
        "BNP Paribas",
        "Barclays Bank",
        "Bank of Bahrain and Kuwait",
        "Doha Bank",
        "Australia and New Zealand Banking Group",
        "Bank of Ceylon",
        "Bank of Nova Scotia",
        "Bank of China",
        "Industrial and Commercial Bank of China",
        "JPMorgan Chase Bank",
        "Mashreq Bank",
        "Mizuho Bank",
        "Sumitomo Mitsui Banking Corporation",
        "United Overseas Bank",
        "Westpac Banking Corporation",
        "Shinhan Bank",
        "Woori Bank",
        "Societe Generale",
        "Sonali Bank"
    ],
    "local_area_banks": [
        "Coastal Local Area Bank",
        "Krishna Bhima Samruddhi Local Area Bank"
    ],
    "state_cooperative_banks": [
        "Andhra Pradesh State Cooperative Bank",
        "Assam State Cooperative Bank",
        "Bihar State Cooperative Bank",
        "Gujarat State Cooperative Bank",
        "Haryana State Cooperative Bank",
        "Himachal Pradesh State Cooperative Bank",
        "Jammu and Kashmir State Cooperative Bank",
        "Karnataka State Cooperative Bank",
        "Kerala State Cooperative Bank",
        "Madhya Pradesh State Cooperative Bank",
        "Maharashtra State Cooperative Bank",
        "Manipur State Cooperative Bank",
        "Meghalaya State Cooperative Bank",
        "Mizoram State Cooperative Bank",
        "Nagaland State Cooperative Bank",
        "Odisha State Cooperative Bank",
        "Punjab State Cooperative Bank",
        "Rajasthan State Cooperative Bank",
        "Tamil Nadu State Cooperative Bank",
        "Telangana State Cooperative Bank",
        "Tripura State Cooperative Bank",
        "Uttar Pradesh State Cooperative Bank",
        "Uttarakhand State Cooperative Bank",
        "West Bengal State Cooperative Bank"
    ],
    "urban_cooperative_banks": [
        "Cosmos Cooperative Bank",
        "Shamrao Vithal Cooperative Bank",
        "NKGSB Cooperative Bank",
        "Saraswat Cooperative Bank",
        "Abhyudaya Cooperative Bank",
        "Kalupur Commercial Cooperative Bank",
        "Thane Janata Sahakari Bank",
        "Janaseva Sahakari Bank",
        "TJSB Sahakari Bank",
        "Dombivli Nagari Sahakari Bank"
    ]
};

const CATEGORY_LABELS = {
    "public_sector_banks": "Public Sector Banks",
    "private_sector_banks": "Private Sector Banks",
    "small_finance_banks": "Small Finance Banks",
    "payment_banks": "Payment Banks",
    "regional_rural_banks": "Regional Rural Banks",
    "foreign_banks": "Foreign Banks",
    "local_area_banks": "Local Area Banks",
    "state_cooperative_banks": "State Cooperative Banks",
    "urban_cooperative_banks": "Urban Cooperative Banks"
};

export function BankSelector({
    label = 'Bank Name',
    placeholder = 'Select Bank',
    onChange,
    defaultValue
}: BankSelectorProps) {
    const handleValueChange = (value: string) => {
        onChange(value);
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="bank-selector">{label}</Label>
            <Select onValueChange={handleValueChange} defaultValue={defaultValue}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                    <ScrollArea className="max-h-[250px]">
                        {Object.entries(BANK_DATA).map(([category, banks]) => (
                            <div key={category}>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground sticky top-0 bg-popover z-10">
                                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                                </div>
                                {banks.sort().map((bank) => (
                                    <SelectItem key={bank} value={bank}>
                                        {bank}
                                    </SelectItem>
                                ))}
                            </div>
                        ))}
                    </ScrollArea>
                </SelectContent>
            </Select>
        </div>
    );
} 