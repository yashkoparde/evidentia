import { AuditLog } from '../types';
import { supabase } from '../supabaseClient';
import { generateLogSummary } from './aiService';

/**
 * Handles the immutable chain of custody logs.
 */
class LogService {
  /**
   * Retrieves all logs from Supabase, filtered by user if provided.
   */
  async getLogs(userId?: string): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*');
      
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });
      
    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
    
    return (data || []).map(row => ({
      id: row.id,
      action: row.action,
      details: row.details,
      timestamp: row.timestamp,
      userName: row.user_name,
      userId: row.user_id,
      status: row.status,
      evidenceId: row.evidence_id,
      aiSummary: row.ai_summary
    }));
  }

  /**
   * Adds a new entry to the audit log.
   */
  async addLog(action: AuditLog['action'], details: string, userName: string, userId?: string, status: AuditLog['status'] = 'success', evidenceId?: string): Promise<AuditLog | null> {
    let aiSummary = undefined;
    
    // Generate AI summary for upload and verify actions
    if (action === 'upload' || action === 'verify') {
      try {
        aiSummary = await generateLogSummary(action, details);
      } catch (e) {
        console.warn('Could not generate AI summary for log:', e);
      }
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{
        action,
        details,
        user_name: userName,
        user_id: userId || null,
        status,
        evidence_id: evidenceId || null,
        ai_summary: aiSummary
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving log:', error);
      return null;
    }

    return {
      id: data.id,
      action: data.action,
      details: data.details,
      timestamp: data.timestamp,
      userName: data.user_name,
      userId: data.user_id,
      status: data.status,
      evidenceId: data.evidence_id,
      aiSummary: data.ai_summary
    };
  }

  /**
   * Bulk deletes logs.
   */
  async deleteLogs(ids: string[]): Promise<boolean> {
    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .in('id', ids);
      
    if (error) {
      console.error('Error deleting logs:', error);
      return false;
    }
    return true;
  }
}

export const logService = new LogService();

