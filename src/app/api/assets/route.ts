import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');

    if (!owner) {
        return NextResponse.json({ error: 'Owner address is required' }, { status: 400 });
    }

    const rpcUrl = process.env.HELIUS_RPC_URL;

    if (!rpcUrl) {
        console.error("HELIUS_RPC_URL is not defined in environment variables");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'my-id',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: owner,
                    page: 1,
                    limit: 1000,
                    displayOptions: {
                        showFungible: true,
                        showInscription: false,
                    },
                },
            }),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error proxying to Helius:", error);
        return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }
}
