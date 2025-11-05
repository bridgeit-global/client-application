'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function redirectToOrgUrl(orgUrl: string) {
  redirect(orgUrl);
}

export async function login(formData: FormData) {
  const supabase = createClient();
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string
  };

  const { error } = await supabase.auth.signInWithPassword(data);
  if (error) {
    console.error('error', error);
    // redirect('/not-found');
  }

  revalidatePath('/', 'layout');

  // Check user role for redirect
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.role === 'operator') {
    redirect('/portal/meter-reading-list');
  } else {
    redirect('/portal/dashboard');
  }
}

export async function signup(formData: FormData) {
  const supabase = createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect('/not-found');
  }

  revalidatePath('/', 'layout');
  redirect('/account');
}

export async function redirectHome() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect operator users to meter-reading page
  if (user?.user_metadata?.role === 'operator') {
    redirect('/portal/meter-reading-list');
  } else {
    redirect('/portal/dashboard');
  }
}
export async function redirectSupport() {
  redirect('/support/registration');
}
