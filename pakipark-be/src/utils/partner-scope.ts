import { SupabaseClient } from '@supabase/supabase-js';

export const isBusinessPartner = (user: any) => user?.role === 'business_partner';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getUserUuid(user: any): string {
  if (user?.id && UUID_PATTERN.test(user.id)) {
    return user.id;
  }
  if (user?.supabaseId && UUID_PATTERN.test(user.supabaseId)) {
    return user.supabaseId;
  }
  if (user?.supabase_id && UUID_PATTERN.test(user.supabase_id)) {
    return user.supabase_id;
  }
  return '00000000-0000-0000-0000-000000000000';
}

export const getPartnerLocationIds = async (supabase: SupabaseClient, user: any): Promise<string[] | null> => {
  if (!isBusinessPartner(user)) return null;
  const userUuid = getUserUuid(user);
  const { data: locations } = await supabase.schema('routing')
    .from('operator_hubs')
    .select('id')
    .eq('owner_user_id', userUuid);
  return (locations || []).map((loc: any) => loc.id);
};

export const assertPartnerOwnsLocation = async (supabase: SupabaseClient, user: any, locationId: string): Promise<boolean> => {
  if (!isBusinessPartner(user)) return true;
  const userUuid = getUserUuid(user);
  const { count } = await supabase.schema('routing')
    .from('operator_hubs')
    .select('id', { count: 'exact', head: true })
    .eq('id', locationId)
    .eq('owner_user_id', userUuid);
  return (count || 0) > 0;
};
