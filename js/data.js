import { sb } from './supabaseClient.js';

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export const fetchNotes = () =>
  sb.from('notes').select('*').order('created_at', { ascending: false }).then(unwrap);

export const createNote = (content) =>
  sb.auth.getUser().then(({ data: { user } }) =>
    sb.from('notes').insert({ content, user_id: user.id }).select().single().then(unwrap));

export const updateNote = (id, payload) =>
  sb.from('notes').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single().then(unwrap);

export const deleteNote = (id) =>
  sb.from('notes').delete().eq('id', id).then(unwrap);
