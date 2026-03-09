import SubmeterBillForm from "@/components/submeter-bill/submeter-bill-form";

export default function SubmeterBillPage() {
  return (
    <div className="container mx-auto py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Submeter Bill Generation
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate electricity bills from submeter readings using site ID and billing period.
        </p>
      </div>
      <SubmeterBillForm />
    </div>
  );
}

