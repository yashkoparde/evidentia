import { Evidence } from '../types';
import { supabase } from '../supabaseClient';

/**
 * Handles database storage of evidence files and their metadata.
 */
class StorageService {
  /**
   * Retrieves a single evidence record by ID.
   */
  async getEvidenceById(id: string): Promise<Evidence | null> {
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching specific evidence:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      caseId: data.case_id,
      fileName: data.file_name,
      fileSize: data.file_size,
      fileType: data.file_type,
      fileHash: data.file_hash,
      blockchainHash: data.tx_hash,
      status: data.status,
      aiSummary: data.ai_summary,
      aiRiskScore: data.ai_risk_score,
      aiObservations: data.ai_observations,
      thumbnail: data.thumbnail,
      thumbnailType: data.thumbnail_type,
      duration: data.duration,
      linkedCases: data.linked_cases || [],
      isDuplicate: data.is_duplicate,
      storagePath: data.storage_path,
      createdAt: data.created_at,
      lastVerified: data.last_verified,
    } as Evidence;
  }

  /**
   * Retrieves all evidence from Supabase, filtered by user if provided.
   */
  async getEvidenceList(userId?: string): Promise<Evidence[]> {
    let query = supabase
      .from('evidence')
      .select('*');
      
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching evidence:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      caseId: row.case_id,
      fileName: row.file_name,
      fileSize: row.file_size,
      fileType: row.file_type,
      fileHash: row.file_hash,
      blockchainHash: row.tx_hash,
      status: row.status,
      aiSummary: row.ai_summary,
      aiRiskScore: row.ai_risk_score,
      aiObservations: row.ai_observations,
      thumbnail: row.thumbnail,
      thumbnailType: row.thumbnail_type,
      duration: row.duration,
      linkedCases: row.linked_cases || [],
      isDuplicate: row.is_duplicate,
      storagePath: row.storage_path,
      createdAt: row.created_at,
      lastVerified: row.last_verified,
    }));
  }

  /**
   * Uploads a physical file to Supabase Storage.
   */
  async uploadFile(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('evidence-vault')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    return data.path;
  }

  /**
   * Generates a signed URL for a private file.
   */
  async getSignedUrl(path: string): Promise<string | null> {
    if (!path) return null;
    
    try {
      const { data, error } = await supabase.storage
        .from('evidence-vault')
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) {
        if (error.message.includes('not found')) {
          console.error('[CRITICAL] Storage bucket "evidence-vault" not found. Please create it in Supabase console.');
        }
        console.warn('[STORAGE] Signed URL failed:', error.message);
        return null;
      }

      return data?.signedUrl || null;
    } catch (err: any) {
      console.warn('[STORAGE] Signed URL exception:', err.message);
      return null;
    }
  }

  /**
   * Gets a public URL for a file.
   */
  getPublicUrl(path: string): string | null {
    if (!path) return null;
    const { data } = supabase.storage
      .from('evidence-vault')
      .getPublicUrl(path);
    return data?.publicUrl || null;
  }

  /**
   * Saves a piece of evidence to Supabase.
   */
  async saveEvidence(evidence: Evidence, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('evidence')
      .insert([{
        id: evidence.id,
        title: evidence.title,
        description: evidence.description,
        case_id: evidence.caseId,
        file_name: evidence.fileName,
        file_size: evidence.fileSize,
        file_type: evidence.fileType,
        file_hash: evidence.fileHash,
        tx_hash: evidence.blockchainHash,
        status: evidence.status || 'pending',
        ai_summary: evidence.aiSummary,
        ai_risk_score: evidence.aiRiskScore,
        ai_observations: evidence.aiObservations,
        thumbnail: evidence.thumbnail,
        thumbnail_type: evidence.thumbnailType,
        duration: evidence.duration,
        linked_cases: evidence.linkedCases,
        is_duplicate: evidence.isDuplicate,
        storage_path: evidence.storagePath,
        last_verified: evidence.lastVerified,
        user_id: userId || null
      }]);

    if (error) {
      console.error('Error saving evidence:', error);
      throw error;
    }
  }

  /**
   * Updates existing evidence.
   */
  async updateEvidence(id: string, updates: Partial<Evidence>): Promise<void> {
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.lastVerified !== undefined) dbUpdates.last_verified = updates.lastVerified;
    if (updates.linkedCases !== undefined) dbUpdates.linked_cases = updates.linkedCases;
    if (updates.aiRiskScore !== undefined) dbUpdates.ai_risk_score = updates.aiRiskScore;
    if (updates.aiSummary !== undefined) dbUpdates.ai_summary = updates.aiSummary;
    if (updates.aiObservations !== undefined) dbUpdates.ai_observations = updates.aiObservations;

    const { error } = await supabase
      .from('evidence')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating evidence:', error);
      throw error;
    }
  }

  /**
   * Deletes evidence from storage and database.
   */
  async deleteEvidence(id: string, storagePath?: string): Promise<void> {
    // 1. Delete from database
    const { error: dbError } = await supabase
      .from('evidence')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting evidence record:', dbError);
      throw dbError;
    }

    // 2. Delete from storage if path exists
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('evidence-vault')
        .remove([storagePath]);

      if (storageError) {
        console.warn('Error deleting file from storage:', storageError);
      }
    }
  }

  /**
   * Updates a user profile.
   */
  async updateProfile(userId: string, data: any): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }
    return true;
  }
}

export const storageService = new StorageService();

