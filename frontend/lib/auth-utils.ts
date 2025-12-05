/**
 * Auth State Utilities
 * 
 * Ensures user records exist in public.users table when auth state changes
 * Handles sync between auth.users and public.users
 */

import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

/**
 * Ensures a user record exists in the public.users table
 * Creates it if missing, updates it if it exists
 */
export async function ensureUserRecord(authUser: User): Promise<boolean> {
  try {
    // Add timeout to prevent hanging
    const checkPromise = supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single();
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('ensureUserRecord timeout')), 3000);
    });
    
    // Check if user record exists with timeout
    const { data: existingUser, error: fetchError } = await Promise.race([
      checkPromise,
      timeoutPromise
    ]) as { data: any; error: any };

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if user doesn't exist
      console.error('[Auth] Error checking user record:', fetchError);
      return false;
    }

    // If user doesn't exist, create it
    if (!existingUser) {
      const insertPromise = supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email || null,
          email_verified: authUser.email_confirmed_at !== null,
          first_name: authUser.user_metadata?.first_name || null,
          last_name: authUser.user_metadata?.last_name || null,
          username: authUser.user_metadata?.username || null,
          wallet_address: authUser.user_metadata?.wallet_address || null,
        });
      
      const insertTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('insert timeout')), 3000);
      });
      
      const { error: insertError } = await Promise.race([
        insertPromise,
        insertTimeoutPromise
      ]) as { error: any };

      if (insertError) {
        console.error('[Auth] Error creating user record:', insertError);
        // If it's a duplicate key error, the user was created by trigger, which is fine
        if (!insertError.message?.includes('duplicate key')) {
          return false;
        }
      }
      console.log('[Auth] Created user record for:', authUser.id);
      return true;
    }

    // If user exists, update email verification status and metadata
    const updates: any = {
      email_verified: authUser.email_confirmed_at !== null,
      updated_at: new Date().toISOString(),
    };

    // Only update fields if they're provided in metadata
    if (authUser.user_metadata?.first_name) {
      updates.first_name = authUser.user_metadata.first_name;
    }
    if (authUser.user_metadata?.last_name) {
      updates.last_name = authUser.user_metadata.last_name;
    }
    if (authUser.user_metadata?.username) {
      updates.username = authUser.user_metadata.username;
    }
    if (authUser.user_metadata?.wallet_address) {
      updates.wallet_address = authUser.user_metadata.wallet_address;
    }

    const updatePromise = supabase
      .from('users')
      .update(updates)
      .eq('id', authUser.id);
    
    const updateTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('update timeout')), 3000);
    });
    
    const { error: updateError } = await Promise.race([
      updatePromise,
      updateTimeoutPromise
    ]) as { error: any };

    if (updateError) {
      console.error('[Auth] Error updating user record:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Auth] Unexpected error ensuring user record:', error);
    return false;
  }
}

/**
 * Updates wallet address in user record when wallet is connected
 */
export async function updateUserWalletAddress(
  userId: string,
  walletAddress: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        wallet_address: walletAddress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[Auth] Error updating wallet address:', error);
      return false;
    }

    // Also update auth user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { wallet_address: walletAddress },
    });

    if (metadataError) {
      console.error('[Auth] Error updating auth metadata:', metadataError);
      // Don't fail if metadata update fails, wallet address is already in DB
    }

    return true;
  } catch (error) {
    console.error('[Auth] Unexpected error updating wallet address:', error);
    return false;
  }
}

