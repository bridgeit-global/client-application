import { Separator } from '@/components/ui/separator';

export default function Layout({
    children,
    pending,
    others,
}: {
    children: React.ReactNode;
    pending: React.ReactNode;
    others: React.ReactNode;
}) {
    return (
        <>
            {children}
            <Separator className="my-4" />
            {pending}
            <Separator className="my-4" />
            {others}
        </>
    );
}
