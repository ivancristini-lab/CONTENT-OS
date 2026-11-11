/** Optional cloud adapter. The MVP stays usable without cloud credentials. */
export type SupabaseConfig = { url: string; publishableKey: string };
export type CloudSession = { access_token: string; refresh_token: string; expires_in: number; user: { id: string; email?: string } };

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  if (!url.startsWith('https://')) return null;
  return { url: url.replace(/\/$/, ''), publishableKey };
}

/** Tokens are deliberately managed by the caller, never embedded in source. */
export class SupabaseGateway {
  constructor(private config: SupabaseConfig, private accessToken?: string) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.config.url}${path}`, {
      ...init,
      headers: {
        apikey: this.config.publishableKey,
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string; msg?: string; error_description?: string };
      throw new Error(body.message ?? body.error_description ?? body.msg ?? `Cloud request failed (${response.status})`);
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') return undefined as T;
    const text = await response.text();
    return text ? JSON.parse(text) as T : undefined as T;
  }

  async signIn(email: string, password: string): Promise<CloudSession> {
    const session = await this.request<CloudSession>('/auth/v1/token?grant_type=password', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    this.accessToken = session.access_token;
    return session;
  }

  async refresh(refreshToken: string): Promise<CloudSession> {
    const session = await this.request<CloudSession>('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }),
    });
    this.accessToken = session.access_token;
    return session;
  }

  async signOut(): Promise<void> {
    await this.request<void>('/auth/v1/logout', { method: 'POST' });
    this.accessToken = undefined;
  }

  async bootstrapProfile(): Promise<string> {
    return this.request<string>('/rest/v1/rpc/bootstrap_content_os', { method: 'POST', body: '{}' });
  }

  async list<T>(table: CloudTable, profileId: string): Promise<T[]> {
    return this.request<T[]>(`/rest/v1/${table}?profile_id=eq.${encodeURIComponent(profileId)}&select=*`);
  }

  async insert<T>(table: CloudTable, record: Record<string, unknown>): Promise<T> {
    const records = await this.request<T[]>(`/rest/v1/${table}`, {
      method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(record),
    });
    if (!records?.[0]) throw new Error('Cloud insert returned no record.');
    return records[0];
  }

  async update<T>(table: CloudTable, id: string, profileId: string, patch: Record<string, unknown>): Promise<T> {
    const records = await this.request<T[]>(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&profile_id=eq.${encodeURIComponent(profileId)}`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch),
    });
    if (!records?.[0]) throw new Error('Cloud update returned no record. Check ownership or stale data.');
    return records[0];
  }

  async upload(userId: string, file: File): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
    const response = await fetch(`${this.config.url}/storage/v1/object/content-os/${path}`, {
      method: 'POST', headers: {
        apikey: this.config.publishableKey,
        Authorization: `Bearer ${this.accessToken ?? ''}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'false',
      }, body: file,
    });
    if (!response.ok) throw new Error(`No se pudo subir el archivo (${response.status}).`);
    return path;
  }

  async signedFileUrl(path: string): Promise<string> {
    const result = await this.request<{ signedURL: string }>(`/storage/v1/object/sign/content-os/${path.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST', body: JSON.stringify({ expiresIn: 300 }),
    });
    return `${this.config.url}/storage/v1${result.signedURL}`;
  }
}

export type CloudTable = 'projects' | 'pillars' | 'social_accounts' | 'sources' | 'stories' | 'ideas' | 'mother_pieces' | 'content_items' | 'content_variants' | 'calendar_slots' | 'learnings' | 'workspace_snapshots';
