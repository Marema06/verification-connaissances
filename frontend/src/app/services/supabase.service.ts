// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  async insertQcm(code: string, qcmHtml: string, pdfUrl: string) {
    const { error } = await this.supabase
      .from('qcm_submissions')
      .insert({
        code_block: code,
        qcm_html: qcmHtml,
        pdf_url: pdfUrl,
      });

    return error;
  }
}
