import { createClient } from './supabase/server';

// lib/fetchGraphQL.ts
export async function fetchGraphQL<T>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const supabase = await createClient();
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session
          ?.access_token}`
      },
      body: JSON.stringify({ query, variables })
    }
  );

  const { data, errors } = await response.json();

  if (errors) {
    throw new Error(
      errors.map((e: { message: string }) => e.message).join('\n')
    );
  }

  return data;
}
