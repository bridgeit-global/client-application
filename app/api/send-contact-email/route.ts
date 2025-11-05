import { NextResponse } from 'next/server';
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, designation, companyName, businessType, numberOfLocations, averageMonthlyBill } = body;

        const recipients = [
            'faisal@bridgeit.in',
            'gajanan@bridgeit.in',
            'paresh@bridgeit.in',
            'riyaz@bridgeit.in'
        ];

        //     const { data, error } = await resend.emails.send({
        //         from: 'BridgeIT <support@bridgeit.in>',
        //         to: recipients,
        //         subject: 'New Contact Request from BridgeIT Website',
        //         html: `
        //     <h2>New Contact Request</h2>
        //     <p><strong>Name:</strong> ${name}</p>
        //     <p><strong>Email:</strong> ${email || 'Not provided'}</p>
        //     <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        //     <p><strong>Designation:</strong> ${designation}</p>
        //     <p><strong>Company Name:</strong> ${companyName}</p>
        //     <p><strong>Business Type:</strong> ${businessType || 'Not provided'}</p>
        //     <p><strong>Number of Locations:</strong> ${numberOfLocations || 'Not provided'}</p>
        //     <p><strong>Average Monthly Bill:</strong> ${averageMonthlyBill || 'Not provided'}</p>
        //   `
        //     });

        //     if (error) {
        //         return NextResponse.json({ error }, { status: 400 });
        //     }

        return NextResponse.json({ recipients });
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
} 